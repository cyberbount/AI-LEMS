"""Quản lý tài liệu hướng dẫn/SOP (FR-014) — nguồn tri thức cho RAG.

Theo mục 2.11 Báo cáo: quyền truy cập tài liệu được kiểm soát trước khi tài liệu
được đưa vào pipeline RAG (cột `documents.allowed_roles`); file upload phải được
kiểm tra loại file và kích thước trước khi xử lý.
"""

import re
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile

from app.deps import Db, current_user, require_roles
from app.models import Document, DocumentChunk, User
from app.schemas import DocumentCreate, DocumentOut, DocumentUpdate
from app.services.audit_service import record_audit_log
from app.utils.tz import hanoi_now_naive

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_UPLOAD_EXTENSIONS = (".txt", ".md")
MAX_UPLOAD_BYTES = 1_000_000  # 1 MB
CHUNK_SIZE = 400


def _chunk_content(content: str, size: int = CHUNK_SIZE) -> list[str]:
    """Chia văn bản thành các đoạn ~size ký tự theo ranh giới đoạn văn."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", content) if p.strip()]
    chunks: list[str] = []
    buf = ""
    for para in paragraphs:
        if len(buf) + len(para) + 1 <= size:
            buf = f"{buf}\n{para}".strip()
            continue
        if buf:
            chunks.append(buf)
        while len(para) > size:
            chunks.append(para[:size])
            para = para[size:]
        buf = para
    if buf:
        chunks.append(buf)
    return chunks or ([content[:size]] if content else [])


CANONICAL_ROLE_ORDER = ("admin", "manager", "technician", "user")


def _validate_allowed_roles(allowed_roles: str) -> list[str]:
    """Chuẩn hóa chuỗi vai trò: hợp lệ + đúng thứ tự canonical (so sánh/lưu ổn định)."""
    roles = {r.strip() for r in (allowed_roles or "").split(",") if r.strip()}
    if not roles or not roles <= set(CANONICAL_ROLE_ORDER):
        raise HTTPException(400, "allowed_roles chỉ chấp nhận các vai trò: admin, manager, technician, user")
    return [r for r in CANONICAL_ROLE_ORDER if r in roles]


def _out(db, doc: Document) -> DocumentOut:
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
    return DocumentOut(
        id=doc.id, name=doc.name, description=doc.description,
        allowed_roles=doc.allowed_roles, chunk_count=chunks, created_at=doc.created_at,
    )


def _create_with_chunks(db, *, name: str, description: str, allowed_roles: str, content: str) -> Document:
    doc = Document(name=name, description=description, allowed_roles=allowed_roles, created_at=hanoi_now_naive())
    db.add(doc)
    db.flush()
    for index, part in enumerate(_chunk_content(content)):
        db.add(DocumentChunk(document_id=doc.id, document_name=doc.name, content=part, chunk_index=index))
    return doc


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Db, _: Annotated[User, Depends(current_user)]):
    return [_out(db, d) for d in db.query(Document).order_by(Document.id).all()]


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: int, db: Db, _: Annotated[User, Depends(current_user)]):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    return _out(db, doc)


@router.post("", response_model=DocumentOut, status_code=201)
def create_document(data: DocumentCreate, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager"))]):
    _validate_allowed_roles(data.allowed_roles)
    if db.query(Document).filter(Document.name == data.name).first():
        raise HTTPException(409, "Tên tài liệu đã tồn tại")
    doc = _create_with_chunks(
        db, name=data.name.strip(), description=data.description,
        allowed_roles=",".join(_validate_allowed_roles(data.allowed_roles)), content=data.content,
    )
    record_audit_log(
        db=db, user=user, action="CREATE", target_type="DOCUMENT",
        target_id=doc.id, target_name=doc.name,
        details=f"Tạo tài liệu '{doc.name}' (allowed_roles={doc.allowed_roles}).",
    )
    db.commit()
    db.refresh(doc)
    return _out(db, doc)


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: UploadFile,
    db: Db,
    user: Annotated[User, Depends(require_roles("admin", "manager"))],
    name: str = Form(""),
    description: str = Form(""),
    allowed_roles: str = Form("admin,manager,technician,user"),
):
    # Kiểm tra loại file theo phần mở rộng trước khi đọc nội dung
    filename = file.filename or ""
    if not filename.lower().endswith(ALLOWED_UPLOAD_EXTENSIONS):
        raise HTTPException(400, f"Chỉ chấp nhận file {'/'.join(ALLOWED_UPLOAD_EXTENSIONS)} — từ chối file '{filename}'")
    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"File vượt quá giới hạn {MAX_UPLOAD_BYTES // 1000} KB")
    try:
        content = raw.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(400, "File phải là văn bản mã hóa UTF-8") from None

    roles = ",".join(_validate_allowed_roles(allowed_roles))
    doc_name = (name or filename.rsplit(".", 1)[0]).strip()[:200]
    if db.query(Document).filter(Document.name == doc_name).first():
        raise HTTPException(409, "Tên tài liệu đã tồn tại")
    doc = _create_with_chunks(db, name=doc_name, description=description, allowed_roles=roles, content=content)
    record_audit_log(
        db=db, user=user, action="CREATE", target_type="DOCUMENT",
        target_id=doc.id, target_name=doc.name,
        details=f"Nạp tài liệu từ file '{filename}' ({len(raw)} bytes, allowed_roles={doc.allowed_roles}).",
    )
    db.commit()
    db.refresh(doc)
    return _out(db, doc)


@router.patch("/{document_id}", response_model=DocumentOut)
def update_document(document_id: int, data: DocumentUpdate, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager"))]):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    changes = []
    if data.description is not None and data.description != doc.description:
        doc.description = data.description
        changes.append("mô tả")
    if data.allowed_roles is not None:
        roles = ",".join(_validate_allowed_roles(data.allowed_roles))
        if roles != doc.allowed_roles:
            doc.allowed_roles = roles
            changes.append(f"allowed_roles -> {roles}")
    if changes:
        record_audit_log(
            db=db, user=user, action="UPDATE", target_type="DOCUMENT",
            target_id=doc.id, target_name=doc.name,
            details="Cập nhật tài liệu: " + ", ".join(changes),
        )
        db.commit()
    db.refresh(doc)
    return _out(db, doc)


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: int, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager"))]):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    snapshot = f"Xóa tài liệu '{doc.name}' (allowed_roles={doc.allowed_roles})"
    db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()
    db.delete(doc)
    record_audit_log(
        db=db, user=user, action="DELETE", target_type="DOCUMENT",
        target_id=document_id, target_name=doc.name, details=snapshot,
    )
    db.commit()

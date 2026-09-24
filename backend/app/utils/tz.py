from datetime import datetime, timezone, timedelta

# Múi giờ Hà Nội (GMT+7 / UTC+7)
VIETNAM_TZ = timezone(timedelta(hours=7))


def hanoi_now() -> datetime:
    """Trả về thời gian hiện tại ở Hà Nội kèm thông tin timezone (aware)."""
    return datetime.now(VIETNAM_TZ)


def hanoi_now_naive() -> datetime:
    """Trả về thời gian thực tế ở Hà Nội dạng naive datetime để lưu trữ chuẩn trong SQLite/MySQL mà không bị lệch 7 tiếng."""
    return datetime.now(VIETNAM_TZ).replace(tzinfo=None)


def to_hanoi_iso(dt: datetime | None) -> str | None:
    """Chuyển đổi datetime sang chuẩn ISO có đuôi +07:00."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Giả định datetime naive lưu trong DB là giờ Hà Nội
        dt = dt.replace(tzinfo=VIETNAM_TZ)
    else:
        dt = dt.astimezone(VIETNAM_TZ)
    return dt.isoformat()


#!/usr/bin/env python3
"""
Traceability Matrix Validator for local-lab-ai project
Validates traceability between requirements and implementation artifacts

This script checks:
1. FR → ARC traceability (requirements to architecture components)
2. ARC → DBT traceability (architecture to database entities)
3. DBT → API traceability (database to API endpoints)
4. API → IMP traceability (API to implementation files)
5. FR → TC traceability (requirements to test cases)
6. TC → SEC traceability (tests to security review)
7. SEC → DOC traceability (security to documentation)

Usage:
    python validate_traceability.py

Output:
    - Missing traceability links
    - Orphaned elements
    - Coverage statistics
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Set, Optional
from dataclasses import dataclass
from collections import defaultdict

@dataclass
class TraceabilityItem:
    id: str
    name: str
    description: str
    file_path: str
    line_start: int
    line_end: int

class TraceabilityValidator:
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.docs_dir = self.project_root / "docs"
        self.backend_dir = self.project_root / "backend"
        self.frontend_dir = self.project_root / "frontend"
        
        # Initialize traceability maps
        self.fr_map: Dict[str, TraceabilityItem] = {}
        self.arc_map: Dict[str, TraceabilityItem] = {}
        self.dbt_map: Dict[str, TraceabilityItem] = {}
        self.api_map: Dict[str, TraceabilityItem] = {}
        self.imp_map: Dict[str, TraceabilityItem] = {}
        self.tc_map: Dict[str, TraceabilityItem] = {}
        self.sec_map: Dict[str, TraceabilityItem] = {}
        self.doc_map: Dict[str, TraceabilityItem] = {}
        
        # Traceability links
        self.fr_to_arc: Dict[str, Set[str]] = defaultdict(set)
        self.arc_to_dbt: Dict[str, Set[str]] = defaultdict(set)
        self.dbt_to_api: Dict[str, Set[str]] = defaultdict(set)
        self.api_to_imp: Dict[str, Set[str]] = defaultdict(set)
        self.fr_to_tc: Dict[str, Set[str]] = defaultdict(set)
        self.tc_to_sec: Dict[str, Set[str]] = defaultdict(set)
        self.sec_to_doc: Dict[str, Set[str]] = defaultdict(set)
        
        self.errors: List[str] = []
        self.warnings: List[str] = []
        
    def parse_requirements(self):
        """Parse requirements.md to extract FRs"""
        req_file = self.docs_dir / "requirements.md"
        if not req_file.exists():
            self.errors.append(f"Requirements file not found: {req_file}")
            return
            
        with open(req_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract FR-XXX patterns
        fr_pattern = r'(FR-\d{3})\s*[:\-]?\s*(.*?)(?=\n|$)'
        for match in re.finditer(fr_pattern, content, re.MULTILINE):
            fr_id, description = match.groups()
            self.fr_map[fr_id] = TraceabilityItem(
                id=fr_id,
                name=fr_id,
                description=description.strip(),
                file_path=str(req_file),
                line_start=content[:match.start()].count('\n') + 1,
                line_end=content[:match.end()].count('\n') + 1
            )
            
    def parse_architecture(self):
        """Parse architecture.md to extract ARC components and traceability"""
        arc_file = self.docs_dir / "architecture.md"
        if not arc_file.exists():
            self.errors.append(f"Architecture file not found: {arc_file}")
            return
            
        with open(arc_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract ARC-XXX patterns
        arc_pattern = r'(ARC-\d{2})\s*[:\-]?\s*(.*?)(?=\n|$)'
        for match in re.finditer(arc_pattern, content, re.MULTILINE):
            arc_id, description = match.groups()
            self.arc_map[arc_id] = TraceabilityItem(
                id=arc_id,
                name=arc_id,
                description=description.strip(),
                file_path=str(arc_file),
                line_start=content[:match.start()].count('\n') + 1,
                line_end=content[:match.end()].count('\n') + 1
            )
            
        # Extract FR → ARC traceability
        trace_pattern = r'FR-(\d{3})\s*→\s*ARC-(\d{2})'
        for match in re.finditer(trace_pattern, content, re.MULTILINE):
            fr_id = f"FR-{match.group(1)}"
            arc_id = f"ARC-{match.group(2)}"
            if fr_id in self.fr_map and arc_id in self.arc_map:
                self.fr_to_arc[fr_id].add(arc_id)
            else:
                self.warnings.append(f"Invalid traceability reference: {fr_id} → {arc_id}")
                
    def parse_database_design(self):
        """Parse database-design.md to extract DBT entities and traceability"""
        dbt_file = self.docs_dir / "database-design.md"
        if not dbt_file.exists():
            self.errors.append(f"Database design file not found: {dbt_file}")
            return
            
        with open(dbt_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract DBT-XXX patterns
        dbt_pattern = r'(DBT-\d{3})\s*[:\-]?\s*(.*?)(?=\n|$)'
        for match in re.finditer(dbt_pattern, content, re.MULTILINE):
            dbt_id, description = match.groups()
            self.dbt_map[dbt_id] = TraceabilityItem(
                id=dbt_id,
                name=dbt_id,
                description=description.strip(),
                file_path=str(dbt_file),
                line_start=content[:match.start()].count('\n') + 1,
                line_end=content[:match.end()].count('\n') + 1
            )
            
        # Extract ARC → DBT traceability
        trace_pattern = r'ARC-(\d{2})\s*→\s*DBT-(\d{3})'
        for match in re.finditer(trace_pattern, content, re.MULTILINE):
            arc_id = f"ARC-{match.group(1)}"
            dbt_id = f"DBT-{match.group(2)}"
            if arc_id in self.arc_map and dbt_id in self.dbt_map:
                self.arc_to_dbt[arc_id].add(dbt_id)
            else:
                self.warnings.append(f"Invalid traceability reference: {arc_id} → {dbt_id}")
                
    def parse_api_design(self):
        """Parse api-design.md to extract API endpoints and traceability"""
        api_file = self.docs_dir / "api-design.md"
        if not api_file.exists():
            self.errors.append(f"API design file not found: {api_file}")
            return
            
        with open(api_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract API-XXX patterns
        api_pattern = r'(API-\d{3})\s*[:\-]?\s*(.*?)(?=\n|$)'
        for match in re.finditer(api_pattern, content, re.MULTILINE):
            api_id, description = match.groups()
            self.api_map[api_id] = TraceabilityItem(
                id=api_id,
                name=api_id,
                description=description.strip(),
                file_path=str(api_file),
                line_start=content[:match.start()].count('\n') + 1,
                line_end=content[:match.end()].count('\n') + 1
            )
            
        # Extract DBT → API traceability
        trace_pattern = r'DBT-(\d{3})\s*→\s*API-(\d{3})'
        for match in re.finditer(trace_pattern, content, re.MULTILINE):
            dbt_id = f"DBT-{match.group(1)}"
            api_id = f"API-{match.group(2)}"
            if dbt_id in self.dbt_map and api_id in self.api_map:
                self.dbt_to_api[dbt_id].add(api_id)
            else:
                self.warnings.append(f"Invalid traceability reference: {dbt_id} → {api_id}")
                
    def parse_implementation(self):
        """Parse implementation files to extract implementation items and traceability"""
        imp_file = self.docs_dir / "implementation-notes.md"
        if not imp_file.exists():
            self.errors.append(f"Implementation notes file not found: {imp_file}")
            return
            
        with open(imp_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract IMP-XXX patterns
        imp_pattern = r'(IMP-\d{3})\s*[:\-]?\s*(.*?)(?=\n|$)'
        for match in re.finditer(imp_pattern, content, re.MULTILINE):
            imp_id, description = match.groups()
            self.imp_map[imp_id] = TraceabilityItem(
                id=imp_id,
                name=imp_id,
                description=description.strip(),
                file_path=str(imp_file),
                line_start=content[:match.start()].count('\n') + 1,
                line_end=content[:match.end()].count('\n') + 1
            )
            
        # Extract API → IMP traceability
        trace_pattern = r'API-(\d{3})\s*→\s*IMP-(\d{3})'
        for match in re.finditer(trace_pattern, content, re.MULTILINE):
            api_id = f"API-{match.group(1)}"
            imp_id = f"IMP-{match.group(2)}"
            if api_id in self.api_map and imp_id in self.imp_map:
                self.api_to_imp[api_id].add(imp_id)
            else:
                self.warnings.append(f"Invalid traceability reference: {api_id} → {imp_id}")
                
    def parse_tests(self):
        """Parse test files to extract test cases and traceability"""
        test_plan_file = self.docs_dir / "test-plan.md"
        if not test_plan_file.exists():
            self.errors.append(f"Test plan file not found: {test_plan_file}")
            return
            
        with open(test_plan_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract TC-XXX patterns
        tc_pattern = r'(TC-\d{3})\s*[:\-]?\s*(.*?)(?=\n|$)'
        for match in re.finditer(tc_pattern, content, re.MULTILINE):
            tc_id, description = match.groups()
            self.tc_map[tc_id] = TraceabilityItem(
                id=tc_id,
                name=tc_id,
                description=description.strip(),
                file_path=str(test_plan_file),
                line_start=content[:match.start()].count('\n') + 1,
                line_end=content[:match.end()].count('\n') + 1
            )
            
        # Extract FR → TC traceability
        trace_pattern = r'FR-(\d{3})\s*→\s*TC-(\d{3})'
        for match in re.finditer(trace_pattern, content, re.MULTILINE):
            fr_id = f"FR-{match.group(1)}"
            tc_id = f"TC-{match.group(2)}"
            if fr_id in self.fr_map and tc_id in self.tc_map:
                self.fr_to_tc[fr_id].add(tc_id)
            else:
                self.warnings.append(f"Invalid traceability reference: {fr_id} → {tc_id}")
                
    def parse_security_review(self):
        """Parse security review file to extract security findings and traceability"""
        sec_file = self.docs_dir / "security-review.md"
        if not sec_file.exists():
            self.errors.append(f"Security review file not found: {sec_file}")
            return
            
        with open(sec_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract SEC-XXX patterns
        sec_pattern = r'(SEC-\d{3})\s*[:\-]?\s*(.*?)(?=\n|$)'
        for match in re.finditer(sec_pattern, content, re.MULTILINE):
            sec_id, description = match.groups()
            self.sec_map[sec_id] = TraceabilityItem(
                id=sec_id,
                name=sec_id,
                description=description.strip(),
                file_path=str(sec_file),
                line_start=content[:match.start()].count('\n') + 1,
                line_end=content[:match.end()].count('\n') + 1
            )
            
        # Extract TC → SEC traceability
        trace_pattern = r'TC-(\d{3})\s*→\s*SEC-(\d{3})'
        for match in re.finditer(trace_pattern, content, re.MULTILINE):
            tc_id = f"TC-{match.group(1)}"
            sec_id = f"SEC-{match.group(2)}"
            if tc_id in self.tc_map and sec_id in self.sec_map:
                self.tc_to_sec[tc_id].add(sec_id)
            else:
                self.warnings.append(f"Invalid traceability reference: {tc_id} → {sec_id}")
                
    def parse_documentation(self):
        """Parse documentation files to extract documentation items and traceability"""
        # Parse each documentation file
        for doc_file in self.docs_dir.glob("*.md"):
            if doc_file.name in ["requirements.md", "architecture.md", "database-design.md", 
                               "api-design.md", "test-plan.md", "security-review.md"]:
                continue
                
            with open(doc_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Extract DOC-XXX patterns
            doc_pattern = r'(DOC-\d{3})\s*[:\-]?\s*(.*?)(?=\n|$)'
            for match in re.finditer(doc_pattern, content, re.MULTILINE):
                doc_id, description = match.groups()
                self.doc_map[doc_id] = TraceabilityItem(
                    id=doc_id,
                    name=doc_id,
                    description=description.strip(),
                    file_path=str(doc_file),
                    line_start=content[:match.start()].count('\n') + 1,
                    line_end=content[:match.end()].count('\n') + 1
                )
                
        # Extract SEC → DOC traceability
        for doc_file in self.docs_dir.glob("*.md"):
            with open(doc_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            trace_pattern = r'SEC-(\d{3})\s*→\s*DOC-(\d{3})'
            for match in re.finditer(trace_pattern, content, re.MULTILINE):
                sec_id = f"SEC-{match.group(1)}"
                doc_id = f"DOC-{match.group(2)}"
                if sec_id in self.sec_map and doc_id in self.doc_map:
                    self.sec_to_doc[sec_id].add(doc_id)
                else:
                    self.warnings.append(f"Invalid traceability reference: {sec_id} → {doc_id}")
                    
    def validate_traceability(self):
        """Validate all traceability links"""
        # Check for missing traceability links
        for fr_id, fr_item in self.fr_map.items():
            if not self.fr_to_arc.get(fr_id):
                self.errors.append(f"FR {fr_id} has no traceability to architecture components")
                
        for arc_id, arc_item in self.arc_map.items():
            if not self.arc_to_dbt.get(arc_id):
                self.warnings.append(f"ARC {arc_id} has no traceability to database entities")
                
        for dbt_id, dbt_item in self.dbt_map.items():
            if not self.dbt_to_api.get(dbt_id):
                self.warnings.append(f"DBT {dbt_id} has no traceability to API endpoints")
                
        for api_id, api_item in self.api_map.items():
            if not self.api_to_imp.get(api_id):
                self.errors.append(f"API {api_id} has no traceability to implementation")
                
        for fr_id, fr_item in self.fr_map.items():
            if not self.fr_to_tc.get(fr_id):
                self.warnings.append(f"FR {fr_id} has no traceability to test cases")
                
        for tc_id, tc_item in self.tc_map.items():
            if not self.tc_to_sec.get(tc_id):
                self.warnings.append(f"TC {tc_id} has no traceability to security findings")
                
        for sec_id, sec_item in self.sec_map.items():
            if not self.sec_to_doc.get(sec_id):
                self.warnings.append(f"SEC {sec_id} has no traceability to documentation")
                
    def generate_report(self):
        """Generate a comprehensive traceability report"""
        report = []
        report.append("# Traceability Matrix Validation Report")
        report.append("=" * 50)
        report.append("")
        
        # Summary statistics
        report.append("## Summary Statistics")
        report.append(f"- Total Functional Requirements (FR): {len(self.fr_map)}")
        report.append(f"- Total Architecture Components (ARC): {len(self.arc_map)}")
        report.append(f"- Total Database Entities (DBT): {len(self.dbt_map)}")
        report.append(f"- Total API Endpoints (API): {len(self.api_map)}")
        report.append(f"- Total Implementation Items (IMP): {len(self.imp_map)}")
        report.append(f"- Total Test Cases (TC): {len(self.tc_map)}")
        report.append(f"- Total Security Findings (SEC): {len(self.sec_map)}")
        report.append(f"- Total Documentation Items (DOC): {len(self.doc_map)}")
        report.append("")
        
        # Traceability coverage
        report.append("## Traceability Coverage")
        fr_to_arc_coverage = len(self.fr_to_arc)/len(self.fr_map)*100 if self.fr_map else 0
        arc_to_dbt_coverage = len(self.arc_to_dbt)/len(self.arc_map)*100 if self.arc_map else 0
        dbt_to_api_coverage = len(self.dbt_to_api)/len(self.dbt_map)*100 if self.dbt_map else 0
        api_to_imp_coverage = len(self.api_to_imp)/len(self.api_map)*100 if self.api_map else 0
        fr_to_tc_coverage = len(self.fr_to_tc)/len(self.fr_map)*100 if self.fr_map else 0
        tc_to_sec_coverage = len(self.tc_to_sec)/len(self.tc_map)*100 if self.tc_map else 0
        sec_to_doc_coverage = len(self.sec_to_doc)/len(self.sec_map)*100 if self.sec_map else 0
        
        report.append(f"- FR → ARC coverage: {len(self.fr_to_arc)}/{len(self.fr_map)} ({fr_to_arc_coverage:.1f}%)")
        report.append(f"- ARC → DBT coverage: {len(self.arc_to_dbt)}/{len(self.arc_map)} ({arc_to_dbt_coverage:.1f}%)")
        report.append(f"- DBT → API coverage: {len(self.dbt_to_api)}/{len(self.dbt_map)} ({dbt_to_api_coverage:.1f}%)")
        report.append(f"- API → IMP coverage: {len(self.api_to_imp)}/{len(self.api_map)} ({api_to_imp_coverage:.1f}%)")
        report.append(f"- FR → TC coverage: {len(self.fr_to_tc)}/{len(self.fr_map)} ({fr_to_tc_coverage:.1f}%)")
        report.append(f"- TC → SEC coverage: {len(self.tc_to_sec)}/{len(self.tc_map)} ({tc_to_sec_coverage:.1f}%)")
        report.append(f"- SEC → DOC coverage: {len(self.sec_to_doc)}/{len(self.sec_map)} ({sec_to_doc_coverage:.1f}%)")
        report.append("")
        
        # Errors
        if self.errors:
            report.append("## Errors")
            for error in self.errors:
                report.append(f"- {error}")
            report.append("")
            
        # Warnings
        if self.warnings:
            report.append("## Warnings")
            for warning in self.warnings:
                report.append(f"- {warning}")
            report.append("")
            
        # Detailed traceability
        report.append("## Detailed Traceability")
        report.append("")
        
        report.append("### FR → ARC")
        for fr_id, arc_ids in self.fr_to_arc.items():
            for arc_id in arc_ids:
                report.append(f"- {fr_id} → {arc_id}")
        report.append("")
        
        report.append("### ARC → DBT")
        for arc_id, dbt_ids in self.arc_to_dbt.items():
            for dbt_id in dbt_ids:
                report.append(f"- {arc_id} → {dbt_id}")
        report.append("")
        
        report.append("### DBT → API")
        for dbt_id, api_ids in self.dbt_to_api.items():
            for api_id in api_ids:
                report.append(f"- {dbt_id} → {api_id}")
        report.append("")
        
        report.append("### API → IMP")
        for api_id, imp_ids in self.api_to_imp.items():
            for imp_id in imp_ids:
                report.append(f"- {api_id} → {imp_id}")
        report.append("")
        
        report.append("### FR → TC")
        for fr_id, tc_ids in self.fr_to_tc.items():
            for tc_id in tc_ids:
                report.append(f"- {fr_id} → {tc_id}")
        report.append("")
        
        report.append("### TC → SEC")
        for tc_id, sec_ids in self.tc_to_sec.items():
            for sec_id in sec_ids:
                report.append(f"- {tc_id} → {sec_id}")
        report.append("")
        
        report.append("### SEC → DOC")
        for sec_id, doc_ids in self.sec_to_doc.items():
            for doc_id in doc_ids:
                report.append(f"- {sec_id} → {doc_id}")
        report.append("")
        
        return "\n".join(report)
        
    def validate(self):
        """Run the complete validation process"""
        print("Starting traceability matrix validation...")
        
        # Parse all documents
        self.parse_requirements()
        self.parse_architecture()
        self.parse_database_design()
        self.parse_api_design()
        self.parse_implementation()
        self.parse_tests()
        self.parse_security_review()
        self.parse_documentation()
        
        # Validate traceability
        self.validate_traceability()
        
        # Generate report
        report = self.generate_report()
        
        # Save report
        report_file = self.project_root / "traceability-report.md"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
            
        print(f"Validation complete. Report saved to: {report_file}")
        print(f"Found {len(self.errors)} errors and {len(self.warnings)} warnings")
        
        return report_file

def main():
    validator = TraceabilityValidator()
    validator.validate()

if __name__ == "__main__":
    main()
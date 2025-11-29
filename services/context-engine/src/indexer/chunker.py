"""AST-aware code chunker using tree-sitter."""

import hashlib
from dataclasses import dataclass
from typing import List, Optional

# Tree-sitter imports (optional - falls back to line-based chunking)
try:
    import tree_sitter_python as tspython
    import tree_sitter_javascript as tsjavascript
    import tree_sitter_typescript as tstypescript
    from tree_sitter import Language, Parser

    TREE_SITTER_AVAILABLE = True
except ImportError:
    TREE_SITTER_AVAILABLE = False
    print("Warning: tree-sitter not available, using line-based chunking")


@dataclass
class CodeChunk:
    """A chunk of code from a file."""

    content: str
    file_path: str
    language: str
    start_line: int
    end_line: int
    node_type: str  # function, class, module, chunk
    sha256: str

    @classmethod
    def from_content(
        cls,
        content: str,
        file_path: str,
        language: str,
        start_line: int,
        end_line: int,
        node_type: str = "chunk",
    ) -> "CodeChunk":
        """Create a CodeChunk with computed hash."""
        sha256 = hashlib.sha256(content.encode()).hexdigest()
        return cls(
            content=content,
            file_path=file_path,
            language=language,
            start_line=start_line,
            end_line=end_line,
            node_type=node_type,
            sha256=sha256,
        )


class ASTChunker:
    """AST-aware code chunker using tree-sitter."""

    MAX_CHUNK_LINES = 100
    OVERLAP_LINES = 10

    # Language configurations
    LANGUAGES = {
        ".py": ("python", ["function_definition", "class_definition"]),
        ".js": ("javascript", ["function_declaration", "class_declaration", "arrow_function"]),
        ".ts": ("typescript", ["function_declaration", "class_declaration", "arrow_function"]),
        ".tsx": ("typescript", ["function_declaration", "class_declaration", "arrow_function"]),
        ".jsx": ("javascript", ["function_declaration", "class_declaration", "arrow_function"]),
    }

    def __init__(self):
        self.parsers = {}

        if TREE_SITTER_AVAILABLE:
            # Initialize parsers for each language
            try:
                py_parser = Parser()
                py_parser.language = Language(tspython.language())
                self.parsers[".py"] = py_parser

                js_parser = Parser()
                js_parser.language = Language(tsjavascript.language())
                self.parsers[".js"] = js_parser
                self.parsers[".jsx"] = js_parser

                ts_parser = Parser()
                ts_parser.language = Language(tstypescript.language())
                self.parsers[".ts"] = ts_parser
                self.parsers[".tsx"] = ts_parser
            except Exception as e:
                print(f"Error initializing tree-sitter parsers: {e}")

    def chunk_file(self, file_path: str, content: str) -> List[CodeChunk]:
        """Chunk a file using AST boundaries when possible."""
        ext = "." + file_path.split(".")[-1] if "." in file_path else ""

        if ext in self.parsers:
            return self._ast_chunk(file_path, content, ext)
        else:
            return self._line_chunk(file_path, content, ext)

    def _ast_chunk(self, file_path: str, content: str, ext: str) -> List[CodeChunk]:
        """Use AST to find semantic boundaries."""
        parser = self.parsers.get(ext)
        if not parser:
            return self._line_chunk(file_path, content, ext)

        try:
            tree = parser.parse(bytes(content, "utf8"))
        except Exception:
            return self._line_chunk(file_path, content, ext)

        chunks = []
        _, node_types = self.LANGUAGES.get(ext, ("unknown", []))
        lines = content.split("\n")

        def visit(node):
            if node.type in node_types:
                start_line = node.start_point[0] + 1
                end_line = node.end_point[0] + 1

                # Extract chunk content
                chunk_lines = lines[start_line - 1 : end_line]
                chunk_content = "\n".join(chunk_lines)

                if chunk_content.strip():
                    chunks.append(
                        CodeChunk.from_content(
                            content=chunk_content,
                            file_path=file_path,
                            language=ext[1:],
                            start_line=start_line,
                            end_line=end_line,
                            node_type=node.type,
                        )
                    )

            for child in node.children:
                visit(child)

        visit(tree.root_node)

        # Fall back to line chunking if no AST chunks found
        return chunks if chunks else self._line_chunk(file_path, content, ext)

    def _line_chunk(
        self, file_path: str, content: str, ext: str = ""
    ) -> List[CodeChunk]:
        """Fallback line-based chunking with overlap."""
        lines = content.split("\n")
        chunks = []
        language = ext[1:] if ext else "unknown"

        for i in range(0, len(lines), self.MAX_CHUNK_LINES - self.OVERLAP_LINES):
            chunk_lines = lines[i : i + self.MAX_CHUNK_LINES]
            chunk_content = "\n".join(chunk_lines)

            if chunk_content.strip():
                chunks.append(
                    CodeChunk.from_content(
                        content=chunk_content,
                        file_path=file_path,
                        language=language,
                        start_line=i + 1,
                        end_line=i + len(chunk_lines),
                        node_type="chunk",
                    )
                )

        return chunks

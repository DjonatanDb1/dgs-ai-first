from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import argparse
import json
import re
from typing import Dict, List

import chromadb
from sentence_transformers import SentenceTransformer


@dataclass
class Chunk:
    chunk_id: str
    text: str
    source: str
    section: str
    version: str
    is_official: bool


class NovaTechRAG:
    def __init__(self, persist_dir: str = "./chroma_db") -> None:
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self.client.get_or_create_collection(name="novatech_docs")

    def _extract_version(self, source: str) -> str:
        name = source.lower()
        if "v2" in name:
            return "v2"
        return "v1"

    def _split_by_sections(self, text: str, source: str) -> List[Chunk]:
        # Split by markdown headings to preserve semantic units.
        blocks = re.split(r"\n(?=## |### )", text)
        chunks: List[Chunk] = []
        for idx, block in enumerate(blocks):
            clean = block.strip()
            if len(clean) < 80:
                continue

            section = clean.splitlines()[0][:120]
            is_official = "faq" not in source.lower()
            chunks.append(
                Chunk(
                    chunk_id=f"{Path(source).stem}-{idx}",
                    text=clean,
                    source=Path(source).name,
                    section=section,
                    version=self._extract_version(source),
                    is_official=is_official,
                )
            )
        return chunks

    def ingest_documents(self, docs_dir: str) -> int:
        docs_path = Path(docs_dir)
        all_chunks: List[Chunk] = []

        for md_file in sorted(docs_path.glob("*.md")):
            text = md_file.read_text(encoding="utf-8")
            all_chunks.extend(self._split_by_sections(text, str(md_file)))

        if not all_chunks:
            return 0

        embeddings = self.embedder.encode(
            [c.text for c in all_chunks],
            normalize_embeddings=True,
        )

        self.collection.upsert(
            ids=[c.chunk_id for c in all_chunks],
            embeddings=embeddings.tolist(),
            documents=[c.text for c in all_chunks],
            metadatas=[
                {
                    "source": c.source,
                    "section": c.section,
                    "version": c.version,
                    "is_official": str(c.is_official),
                }
                for c in all_chunks
            ],
        )
        return len(all_chunks)

    def query_chunks(self, question: str, top_k: int = 5) -> List[Dict]:
        question_embedding = self.embedder.encode(question, normalize_embeddings=True).tolist()

        result = self.collection.query(
            query_embeddings=[question_embedding],
            n_results=top_k,
        )

        hits: List[Dict] = []
        for i in range(len(result["ids"][0])):
            distance = float(result["distances"][0][i])
            score = 1.0 - min(max(distance, 0.0), 1.0)
            meta = result["metadatas"][0][i]
            hits.append(
                {
                    "id": result["ids"][0][i],
                    "score": round(score, 4),
                    "text": result["documents"][0][i],
                    "source": meta["source"],
                    "section": meta["section"],
                    "version": meta["version"],
                    "is_official": meta["is_official"],
                }
            )
        return hits

    def build_prompt(self, question: str, hits: List[Dict]) -> str:
        system_prompt = (
            "Voce e o assistente de atendimento da NovaTech. "
            "Use somente as evidencias dos chunks recuperados. "
            "Sempre cite fontes. Nao invente prazos, valores, tiers ou procedimentos. "
            "Se nao houver informacao suficiente, diga explicitamente que nao encontrou."
        )

        chunks_text = []
        for idx, hit in enumerate(hits, start=1):
            chunks_text.append(
                f"[Chunk {idx}] fonte={hit['source']} secao={hit['section']} score={hit['score']}\n"
                f"{hit['text']}"
            )

        return (
            f"SYSTEM:\n{system_prompt}\n\n"
            f"CONTEXTO:\n{chr(10).join(chunks_text)}\n\n"
            f"PERGUNTA:\n{question}\n\n"
            "Responda em portugues formal e acessivel."
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Pipeline RAG POC da NovaTech")
    parser.add_argument("--docs-dir", required=True, help="Pasta com documentos .md para ingestao")
    parser.add_argument("--persist-dir", default="./chroma_db", help="Pasta de persistencia do Chroma")
    parser.add_argument("--question", help="Pergunta para executar retrieval")
    parser.add_argument("--top-k", type=int, default=5, help="Quantidade de chunks retornados")
    args = parser.parse_args()

    rag = NovaTechRAG(persist_dir=args.persist_dir)
    total_chunks = rag.ingest_documents(args.docs_dir)
    print(f"Chunks ingeridos: {total_chunks}")

    if args.question:
        hits = rag.query_chunks(args.question, top_k=args.top_k)
        prompt = rag.build_prompt(args.question, hits)

        payload = {
            "question": args.question,
            "hits": [
                {
                    "id": h["id"],
                    "score": h["score"],
                    "source": h["source"],
                    "section": h["section"],
                    "version": h["version"],
                }
                for h in hits
            ],
            "prompt_preview": prompt[:1400],
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

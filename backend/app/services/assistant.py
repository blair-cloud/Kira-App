import re
from sqlalchemy import select
from app.models import KnowledgeSource, Resource


def knowledge_reply(db, prompt: str):
    # An approved-content retrieval adapter, not an LLM or clinical inference.
    words = set(re.findall(r'[a-z]{4,}', prompt.lower())) - {'what', 'with', 'this', 'that', 'about', 'have', 'help'}
    candidates = list(db.scalars(select(Resource).where(Resource.status == 'published')))
    candidates += list(db.scalars(select(KnowledgeSource).where(KnowledgeSource.status == 'published')))
    matches = sorted(((len(words & set(re.findall(r'[a-z]{4,}', (item.title + ' ' + getattr(item, 'description', '')).lower()))), item) for item in candidates), key=lambda pair: pair[0], reverse=True)
    relevant = [item for score, item in matches[:3] if score > 0]
    if re.search(r'\b(diagnos\w*|prescrib\w*|medication|dosage)\b', prompt, re.I):
        text = 'Kira cannot diagnose conditions or recommend medication or doses. Please discuss that question with a qualified health professional. You can find the Nurse Office and Counsellor Office on Contact.'
    elif relevant:
        text = 'Here are published learning resources related to your question:\n\n' + '\n\n'.join(f'{item.title}: {getattr(item, "description", "") or getattr(item, "content", getattr(item, "body", ""))[:350]}' for item in relevant)
    else:
        text = 'You can explore mental wellbeing, study balance, relationships, and self-care in Learn. For personal guidance, contact the Counsellor Office or Nurse Office. For immediate danger, contact emergency services directly rather than waiting for a chat reply.'
    return text + '\n\nKira is currently using approved-content search, not a live generative AI model. This information is educational and does not replace professional care.'

---
module: why-questions
version: 1
---

# Why questions skill

How to write one answer card.

## Format

Part 1 is the question. The next parts explain the answer step by step in simple words. Last part is a fun 'try this' idea that is safe to do at home with a grown-up.

Return JSON only:

```json
{"items": [{"title": "Short title", "parts": ["Part one.", "Part two."], "tags": ["one-word-tag"]}]}
```

- `title`: 2 to 6 words.
- `parts`: the content, in the order it is read aloud.
- `tags`: 1 to 3 lowercase topic words.

## Length by age band

- `4-6`: 1 to 3 parts, at most 2 short sentences per part, at most 8 words per sentence, very simple words
- `7-9`: 2 to 4 parts, at most 3 sentences per part, simple words
- `10-12`: 3 to 5 parts, at most 4 sentences per part, everyday words
- `13+`: 3 to 6 parts, at most 5 sentences per part, clear language

## Collections

- `sky-and-weather`: Sky and weather
- `animals-and-plants`: Animals and plants

## Checklist before returning

- Every part is safe to read aloud to the youngest child in the age band.
- No names of real people, brands, apps or websites.
- Each item is different from the existing titles you are given.

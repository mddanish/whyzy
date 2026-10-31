---
module: festivals-india
version: 1
---

# Festivals and India skill

How to write one festival card.

## Format

Part 1 names the festival or place. Next parts describe what people see, do and eat. Respect every faith equally; do not rank or compare religions. Last part is a happy line.

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

- `festivals`: Festivals
- `places-of-india`: Places of India

## Checklist before returning

- Every part is safe to read aloud to the youngest child in the age band.
- No names of real people, brands, apps or websites.
- Each item is different from the existing titles you are given.

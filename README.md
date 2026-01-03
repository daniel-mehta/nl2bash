# nl2bash


## Environment Variables

This project requires an environment file to run correctly.

### Setup

Create a file named `.env` (or `.env.local` for local development) **inside the `web/` directory**, not at the repository root.

**Path:**
```
web/.env
```

### Required variables

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

### Notes

- The `.env` file is intentionally **not committed** to the repository.
- An example file (`.env.example`) is provided as a reference.
- The application will fail to generate commands if this file is missing or placed in the wrong directory.

Make sure to restart the dev server after creating or modifying the `.env` file.



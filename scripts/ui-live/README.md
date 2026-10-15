# Local functional QA

This development-only Vite entry renders the real application against a real local API on port 3182. A separate local fixture service on port 3183 supplies disposable QA sessions. It is not a production entry point and contains no credentials.

Open `/scripts/ui-live/index.html?route=/admin/settings&role=primary_admin&theme=light` with Vite on port 5182. Supported fixture roles include `college_admin` and `student`. The fixture server and isolated database must already exist; this entry does not provision them.

Secure assessments deliberately use the application's same-window fallback. This harness does not verify the separate secure popup, external email delivery, S3 uploads, password changes, or remote programming execution.

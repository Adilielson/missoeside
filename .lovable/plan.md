# Plan - Administrative Route Access and Analytics Testing

Verify access to administrative routes, ensure the "Acompanhamento" (Analytics) panel is correctly tracking interactions (including button clicks and PIX code copying), and confirm the "Histórico" (Activity History) records these actions.

## User Review Required

> [!IMPORTANT]
> Since testing authenticated routes and specific button actions requires a live user session, I will use a Playwright script to simulate these actions in the sandbox environment.

- **Authentication**: I will attempt to mint a session for an existing administrative user to access the `/admin` routes.
- **Verification**: I will perform specific actions (visiting pages, clicking buttons) and then check the Analytics and History panels to ensure they captured the data with the correct Brazilian time (America/Sao_Paulo).

## Technical Details

### Administrative Access
- Navigate to `/admin/login` and verify redirections.
- Confirm sidebar visibility of "Acompanhamento" and "Histórico" for administrators.

### Analytics Tracking (`page_events` table)
- **Page Views**: Verify that navigating to `/nossos-projetos` and project details generates `page_view` events.
- **Button Clicks**:
    - Trigger "Apoiar Agora" clicks and verify `button_click` events with `metadata.location`.
    - Trigger PIX CNPJ copy action and verify `copiar_pix_cnpj` event.
- **Timezone**: Ensure `created_at` timestamps are correctly interpreted as Brasília time in the dashboard display (`America/Sao_Paulo`).

### Audit Logging
- Perform a dummy update (e.g., updating a post or user permission) and verify it appears in `/admin/history`.

### Validation Steps
1. Run a Playwright script to:
    - Log in to `/admin`.
    - Navigate to public pages and click tracking-enabled buttons.
    - Return to `/admin/analytics` and `/admin/history` to verify records exist.
2. Capture screenshots of the Analytics dashboard showing the new data.

name: Bug report
description: Something is broken or behaves wrongly
title: "[Bug] "
labels: ["bug", "needs-triage"]
body:
  - type: markdown
    attributes:
      value: |
        OpenStore is used by shop owners who are not developers. Please describe
        what you saw, not what you think caused it.

  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: What did you do, what did you expect, what happened instead?
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      value: |
        1.
        2.
        3.
    validations:
      required: true

  - type: textarea
    id: error
    attributes:
      label: Error message
      description: Copy the exact text from the screen or the browser console.
      render: shell

  - type: dropdown
    id: area
    attributes:
      label: Where does it happen?
      options:
        - Storefront (buyer-facing pages)
        - Checkout or cart
        - Admin dashboard
        - Delivery or tracking
        - Setup or installation
        - Something else
    validations:
      required: true

  - type: input
    id: version
    attributes:
      label: OpenStore version or commit
      placeholder: v0.1.0 or the commit SHA from Settings

  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: Which database setup are you using, and what device?
      value: |
        - Database: Supabase Cloud / local Docker / not set up yet
        - Device: desktop / Android / iPhone
        - Browser:
        - Arabic or French:
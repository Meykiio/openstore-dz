name: Feature request
description: Suggest something OpenStore should be able to do
title: "[Feature] "
labels: ["enhancement", "needs-triage"]
body:
  - type: markdown
    attributes:
      value: |
        Before opening this: OpenStore is cash-on-delivery first and deliberately
        does not intermediate payments. Anything that would make the platform
        hold or move a shop owner's money will be declined, because no Algerian
        payment provider supports split payouts and a foreign entity cannot get
        a CIB or Edahabia merchant ID without Algerian registration.

  - type: textarea
    id: problem
    attributes:
      label: What problem does this solve?
      description: Describe the situation, not the solution. Who hits it, how often, what do they do today instead?
    validations:
      required: true

  - type: textarea
    id: proposal
    attributes:
      label: What you would like to happen
    validations:
      required: true

  - type: dropdown
    id: area
    attributes:
      label: Which part of OpenStore?
      options:
        - Storefront
        - Checkout
        - Admin dashboard
        - Delivery
        - Setup and installation
        - Documentation
        - Not sure
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives you considered
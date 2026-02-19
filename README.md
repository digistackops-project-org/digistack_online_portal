# Digistack Online Portal: CI/CD Pipeline

This document outlines the automated workflow from the initial developer commit to production deployment and monitoring.

## 🚀 Pipeline Workflow

```mermaid
graph LR
    %% Workflow Steps
    A[Developer Commit] --> B[Pull Request]
    B --> C[Code Review]
    C --> D[Merge to Develop]
    
    subgraph CI ["Continuous Integration"]
        D --> E[CI Build]
        E --> F[Unit Tests]
        F --> G[Integration Tests]
    end

    subgraph CD_DEV ["Development Deployment"]
        G --> H[Deploy to Dev VM]
        H --> I[QA Testing]
    end

    subgraph CD_UAT ["Staging & UAT"]
        I --> J[Merge to Release]
        J --> K[UAT Deployment]
        K --> L{Signoff}
    end

    subgraph CD_PROD ["Production Release"]
        L -- Approved --> M[Merge to Main]
        M --> N[Production Deployment]
        N --> O[Smoke Tests]
        O --> P[Monitoring Enabled]
    end

    %% Styling for visual clarity
    style CI fill:#e1f5fe,stroke:#01579b
    style CD_DEV fill:#f1f8e9,stroke:#33691e
    style CD_UAT fill:#fffde7,stroke:#fbc02d
    style CD_PROD fill:#fce4ec,stroke:#880e4f
    style L fill:#fff,stroke-dasharray: 5 5

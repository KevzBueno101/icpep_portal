---
title: Data Flow Diagram
description: Context diagram and level-0/level-1 data flow diagrams for the ICPEP Portal
---

# Data Flow Diagram (DFD)

This page documents the ICPEP Portal using classic DFD notation — useful for academic review and for the next-generation maintainers to see where every piece of data enters and leaves the system.

**Legend for the diagrams below:**

| Shape | Meaning |
|---|---|
| `[ Rectangle ]` | External entity (person or system outside the portal) |
| `([ Rounded ])` | Process (transform of data) |
| `[( Cylinder )]` | Data store (persistent data) |

## Context Diagram (Level 0)

```mermaid
flowchart LR
    MEMBER[Member / Visitor]
    OFFICER[Officer / Admin]
    CLOUD[Cloudinary]
    SENDGRID[SendGrid]
    PUSH[Browser Push Service]

    SYS([ICPEP Portal])

    MEMBER <-->|"register, login, renew, profile, announcements"| SYS
    OFFICER <-->|"manage members, content, roles, logs"| SYS
    SYS <-->|"upload / fetch images, proofs, receipts"| CLOUD
    SYS <-->|"password reset emails"| SENDGRID
    SYS <-->|"web push notifications"| PUSH
```

The portal is a single system exchanging data with five external entities: **Member/Visitor**, **Officer/Admin**, **Cloudinary** (media), **SendGrid** (email), and the **Browser Push Service**.

## Level-1 DFD

```mermaid
flowchart LR
    subgraph External
        M[Member / Visitor]
        O[Officer / Admin]
        C[Cloudinary]
        E[SendGrid]
        P[Browser Push]
    end

    subgraph Processes
        P1([1.0 Register & Auth])
        P2([2.0 Approve Membership])
        P3([3.0 Generate E-Receipt])
        P4([4.0 Manage Content])
        P5([5.0 Publish & Push])
        P6([6.0 Audit Logging])
        P7([7.0 Renewal])
    end

    subgraph Stores
        D1[(User)]
        D2[(MemberProfile)]
        D3[(PaymentTransaction)]
        D4[(Announcement / Milestone)]
        D5[(PushSubscription)]
        D6[(AuditLog)]
    end

    M -->|credentials| P1
    P1 --> D1
    P1 --> D2
    P1 --> D1

    O -->|approve / reject| P2
    P2 --> D2
    P2 --> P3
    P3 --> D3
    C <-->|media| P3

    O -->|content| P4
    P4 --> D4
    P4 --> P5
    P5 --> D5
    P5 --> P
    D5 --> P5

    M -->|renewal request| P7
    P7 --> D3
    P7 --> D2

    P1 --> P6
    P2 --> P6
    P4 --> P6
    P7 --> P6
    P6 --> D6
    O --> D6
    D6 --> O

    P3 --> D6
```

### Process list

| # | Process | Description | Data stores read/written |
|---|---|---|---|
| 1.0 | Register & Auth | Registration, login, admin-login, JWT refresh | User, MemberProfile |
| 2.0 | Approve Membership | Admin approval/rejection of member application | MemberProfile, AuditLog |
| 3.0 | Generate E-Receipt | Pillow PNG receipt on approval | PaymentTransaction, Cloudinary |
| 4.0 | Manage Content | Announcements + milestones CRUD, reorder | Announcement/Milestone, AuditLog |
| 5.0 | Publish & Push | Publish announcement → background web push to subscriptions | Announcement, PushSubscription |
| 6.0 | Audit Logging | `log_action()` records every privileged change | AuditLog |
| 7.0 | Renewal | Member renews expired/rejected membership | MemberProfile, PaymentTransaction |

## Level-2 DFD: Membership Approval

```mermaid
flowchart LR
    M[Member]
    O[Officer / Admin]
    D1[(MemberProfile)]
    D3[(PaymentTransaction)]
    C[Cloudinary]
    D6[(AuditLog)]

    P1([1.0 Register]) --> D1
    D1 -->|"status = PENDING"| P2([2.1 Review Application])
    O -->|"GET /members/pk/"| P2
    P2 -->|"payment proof + COE/ID"| O
    O -->|"POST /members/pk/approve/"| P3([2.2 Decide])
    P3 -->|"APPROVED"| P4([3.1 Build Transaction])
    P3 -->|"REJECTED"| D1
    P4 --> D3
    P4 --> P5([3.2 Render Receipt])
    P5 --> C
    P4 --> D6
    P3 --> D6
```

## Level-2 DFD: Announcement Publishing + Push

```mermaid
flowchart LR
    O[Officer / Admin]
    D4[(Announcement)]
    D5[(PushSubscription)]
    D6[(AuditLog)]
    P[Browser Push Service]

    P1([4.1 Create]) --> D4
    P1 --> D6
    D4 -->|"is_published = true"| P2([5.1 Send Push])
    P2 -->|"query active subs"| D5
    P2 -->|"payload {title, body, url}"| P
    P2 -.->|"410 Gone → prune"| D5
```

> **Push behavior note:** push fires only at **creation** (`perform_create`), when `is_published=True`. Re-publishing an existing draft does not re-trigger a push.

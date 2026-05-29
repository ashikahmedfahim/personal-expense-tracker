# Namecheap DNS for `personalexpensetracker.site`

DNS is managed in [Namecheap](https://www.namecheap.com/) — **not** Route 53. Leave `route53_zone_id` and `route53_zone_name` **empty** in `terraform.tfvars`.

Terraform still creates ACM certificates and the ALB in **eu-north-1**. You add records manually in Namecheap **Advanced DNS**.

## Hostnames

| Namecheap Host | Points to | Purpose |
|----------------|-----------|---------|
| `www` | (your existing server) | Nginx site — keep as-is |
| `api` | ALB DNS name | Production API |
| `staging-api` | Staging ALB DNS name | Staging API |
| `_xxxx.api` | (ACM validation target) | One-off per prod cert |
| `_xxxx.staging-api` | (ACM validation target) | One-off per staging cert |

## Step-by-step (each environment: staging, then prod)

### 1. First `terraform apply`

```bash
cd terraform/environments/staging   # or prod
terraform apply
```

Apply may **wait several minutes** on `aws_acm_certificate_validation` until DNS exists. If it times out, add records below and run `terraform apply` again.

### 2. ACM validation CNAME(s)

```bash
terraform output -json acm_validation_records
terraform output -json namecheap_dns
```

In Namecheap: **Domain List** → **Manage** → **Advanced DNS** → **Add New Record**

For each validation record:

| Field | Value |
|-------|--------|
| Type | `CNAME` |
| Host | Use `namecheap_dns.acm_validation[].host` from Terraform (e.g. `_a1b2c3d4.api`) |
| Value | Copy `value` from output (ACM target, often `....acm-validations.aws`) |
| TTL | Automatic |

**Tip:** Namecheap “Host” is usually the subdomain part only, not the full FQDN. Terraform outputs `host` already shortened for `personalexpensetracker.site`.

### 3. Run `terraform apply` again

Wait until apply finishes and `aws_acm_certificate_validation` succeeds.

### 4. API CNAME (HTTPS traffic to ALB)

From the same environment:

```bash
terraform output -json namecheap_dns
```

Add record:

| Field | Value |
|-------|--------|
| Type | `CNAME` |
| Host | `api` or `staging-api` (from `namecheap_dns.api_cname.host`) |
| Value | ALB DNS name from `namecheap_dns.api_cname.value` (e.g. `expense-tracker-prod-alb-....eu-north-1.elb.amazonaws.com`) |
| TTL | Automatic |

Do **not** include `https://` in the Value — hostname only.

### 5. Verify

Allow a few minutes for DNS propagation, then:

```bash
curl -fsS https://api.personalexpensetracker.site/health
curl -fsS https://staging-api.personalexpensetracker.site/health
```

## Staging vs production

Run steps **twice** — once per folder:

| Environment | Terraform path | API host (Namecheap) | `API_URL` for GitHub |
|-------------|----------------|----------------------|----------------------|
| Staging | `terraform/environments/staging` | `staging-api` | `https://staging-api.personalexpensetracker.site` |
| Production | `terraform/environments/prod` | `api` | `https://api.personalexpensetracker.site` |

Each environment has its **own** ALB and ACM validation CNAMEs.

## Common issues

| Problem | Fix |
|---------|-----|
| ACM validation stuck | Confirm CNAME Host/Value match `terraform output` exactly; wait 5–30 min; re-apply |
| `SSL certificate problem` | Cert must be in **eu-north-1** (same as ALB) — Terraform handles this |
| 502 from ALB | ECS tasks not healthy — check CloudWatch logs; run deploy workflow |
| Wrong subdomain | `www` must not point at the API ALB unless you replace nginx |

## Optional: move DNS to Route 53 later

If you transfer DNS to Route 53, set `route53_zone_name = "personalexpensetracker.site"` in `terraform.tfvars` and apply — Terraform will manage validation and alias records automatically.

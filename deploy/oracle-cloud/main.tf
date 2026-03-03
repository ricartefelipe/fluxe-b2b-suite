terraform {
  required_version = ">= 1.5"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# --- Availability Domain ---

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

locals {
  ad_name = data.oci_identity_availability_domains.ads.availability_domains[0].name
}

# --- Ubuntu 22.04 aarch64 image ---

data "oci_core_images" "ubuntu_arm" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# --- VCN ---

resource "oci_core_vcn" "fluxe" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "fluxe-vcn"
  dns_label      = "fluxevcn"
}

# --- Internet Gateway ---

resource "oci_core_internet_gateway" "fluxe" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.fluxe.id
  display_name   = "fluxe-igw"
  enabled        = true
}

# --- Route Table ---

resource "oci_core_route_table" "fluxe" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.fluxe.id
  display_name   = "fluxe-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    network_entity_id = oci_core_internet_gateway.fluxe.id
  }
}

# --- Security List ---

resource "oci_core_security_list" "fluxe" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.fluxe.id
  display_name   = "fluxe-sl"

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 22
      max = 22
    }
    description = "SSH"
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
    description = "HTTP"
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
    description = "HTTPS"
  }

  ingress_security_rules {
    protocol = "1" # ICMP
    source   = "0.0.0.0/0"
    icmp_options {
      type = 3
      code = 4
    }
    description = "ICMP Path Discovery"
  }
}

# --- Subnet ---

resource "oci_core_subnet" "fluxe" {
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_vcn.fluxe.id
  cidr_block        = var.subnet_cidr
  display_name      = "fluxe-public-subnet"
  dns_label         = "fluxepub"
  route_table_id    = oci_core_route_table.fluxe.id
  security_list_ids = [oci_core_security_list.fluxe.id]
}

# --- Compute Instance (Ampere A1 — Always Free) ---

resource "oci_core_instance" "fluxe" {
  compartment_id      = var.compartment_ocid
  availability_domain = local.ad_name
  display_name        = var.instance_display_name
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_gb
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu_arm.images[0].id
    boot_volume_size_in_gbs = var.boot_volume_gb
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.fluxe.id
    assign_public_ip = true
    display_name     = "fluxe-vnic"
  }

  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
  }
}

# --- Outputs ---

output "instance_public_ip" {
  description = "IP público da instância"
  value       = oci_core_instance.fluxe.public_ip
}

output "instance_id" {
  description = "OCID da instância"
  value       = oci_core_instance.fluxe.id
}

output "ssh_command" {
  description = "Comando SSH para conectar"
  value       = "ssh ubuntu@${oci_core_instance.fluxe.public_ip}"
}

output "next_steps" {
  description = "Próximos passos após terraform apply"
  value       = <<-EOT
    1. SSH: ssh ubuntu@${oci_core_instance.fluxe.public_ip}
    2. Setup: sudo bash /tmp/server-setup.sh
    3. Config: cp .env.example .env && nano .env
    4. Deploy: ./scripts/deploy.sh
  EOT
}

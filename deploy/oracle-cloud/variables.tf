variable "tenancy_ocid" {
  description = "OCID do tenancy Oracle Cloud"
  type        = string
}

variable "user_ocid" {
  description = "OCID do usuário OCI"
  type        = string
}

variable "fingerprint" {
  description = "Fingerprint da API key"
  type        = string
}

variable "private_key_path" {
  description = "Caminho para a chave privada da API key"
  type        = string
  default     = "~/.oci/oci_api_key.pem"
}

variable "region" {
  description = "Região OCI (ex: sa-saopaulo-1)"
  type        = string
  default     = "sa-saopaulo-1"
}

variable "compartment_ocid" {
  description = "OCID do compartment (usar tenancy_ocid para root)"
  type        = string
}

variable "ssh_public_key_path" {
  description = "Caminho para a chave SSH pública"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "instance_display_name" {
  description = "Nome da instância"
  type        = string
  default     = "fluxe-b2b"
}

variable "instance_ocpus" {
  description = "Número de OCPUs (Always Free: até 4)"
  type        = number
  default     = 4
}

variable "instance_memory_gb" {
  description = "RAM em GB (Always Free: até 24)"
  type        = number
  default     = 24
}

variable "boot_volume_gb" {
  description = "Tamanho do boot volume em GB (Always Free: até 200)"
  type        = number
  default     = 200
}

variable "vcn_cidr" {
  description = "CIDR block da VCN"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  description = "CIDR block da subnet pública"
  type        = string
  default     = "10.0.1.0/24"
}

import csv
import time
from pathlib import Path

import httpx

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

IBGE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/estados/27/municipios"
CNES_URL = "https://apidadosabertos.saude.gov.br/cnes/estabelecimentos"

# Calendário básico do PNI (dado ilustrativo quando a fonte CNES não lista vacinas por unidade)
PNI_BASIC_VACCINES = ";".join(
    [
        "BCG",
        "Hepatite B",
        "Penta (DTP+Hib+HB)",
        "Poliomielite (VIP)",
        "Rotavírus (VORH)",
        "Pneumocócica 10-valente",
        "Meningocócica C",
        "Febre Amarela",
        "Tríplice Viral",
        "DTP",
        "Hepatite A",
        "Varicela",
        "Influenza",
        "Covid-19",
    ]
)


def fetch_cities() -> dict[str, int]:
    """Fetch all 102 Alagoas municipalities from IBGE and write data/cities.csv."""
    resp = httpx.get(IBGE_URL, timeout=30)
    resp.raise_for_status()
    raw_cities = sorted(resp.json(), key=lambda c: c["nome"])

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    cities_path = DATA_DIR / "cities.csv"
    ibge6_to_city_id: dict[str, int] = {}

    with cities_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "name", "ibge_code"])
        for idx, city in enumerate(raw_cities, start=1):
            ibge_code = int(city["id"])
            name = city["nome"].strip()
            writer.writerow([idx, name, ibge_code])
            ibge6_to_city_id[str(ibge_code)[:6]] = idx

    print(f"Cidades salvas em {cities_path}: {len(raw_cities)}")
    return ibge6_to_city_id


def format_address(street: str | None, number: str | None) -> str | None:
    """Combine street and number into a clean address string."""
    street_clean = (street or "").strip()
    number_clean = (number or "").strip()
    if not street_clean:
        return None
    if number_clean and number_clean.upper() not in {"S/N", "SN", "0"}:
        return f"{street_clean}, {number_clean}"
    if number_clean:
        return f"{street_clean}, {number_clean}"
    return street_clean


def clean_text(value: str | None) -> str | None:
    """Normalize optional text fields, turning empty strings into None."""
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned if cleaned else None


def fetch_vaccination_points(ibge6_to_city_id: dict[str, int]) -> None:
    """Fetch active UBS units in Alagoas from CNES Dados Abertos API and write CSV."""
    limit = 20  # API Dados Abertos do CNES retorna no máximo 20 registros por página
    page = 0    # Na API do CNES, o parâmetro 'offset' funciona como número da página (0, 1, 2...)
    all_units: list[dict] = []
    seen_cnes: set[int] = set()

    with httpx.Client(timeout=45) as client:
        while True:
            params = {
                "codigo_uf": 27,
                "codigo_tipo_unidade": 2,  # Centro de Saúde / Unidade Básica de Saúde
                "limit": limit,
                "offset": page,
            }
            batch = []
            for attempt in range(3):
                try:
                    resp = client.get(CNES_URL, params=params)
                    resp.raise_for_status()
                    batch = resp.json().get("estabelecimentos", [])
                    break
                except (httpx.ReadTimeout, httpx.ConnectTimeout, httpx.HTTPStatusError):
                    if attempt == 2:
                        raise
                    time.sleep(2 * (attempt + 1))

            if not batch:
                break
            print(f"Página {page}: {len(batch)} registros", flush=True)
            for unit in batch:
                cnes_id = unit.get("codigo_cnes")
                if cnes_id not in seen_cnes:
                    seen_cnes.add(cnes_id)
                    all_units.append(unit)
            if len(batch) < limit:
                break
            page += 1

    points_path = DATA_DIR / "vaccination_points.csv"
    saved = 0
    skipped = 0

    with points_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "id",
                "city_id",
                "name",
                "address",
                "neighborhood",
                "phone",
                "opening_hours",
                "vaccines",
                "latitude",
                "longitude",
            ]
        )
        for unit in all_units:
            # Ignorar unidades desativadas ou que não atendem SUS
            if unit.get("codigo_motivo_desabilitacao_estabelecimento") is not None:
                skipped += 1
                continue
            if unit.get("estabelecimento_faz_atendimento_ambulatorial_sus") != "SIM":
                skipped += 1
                continue

            ibge6 = str(unit.get("codigo_municipio", ""))
            city_id = ibge6_to_city_id.get(ibge6)
            if city_id is None:
                skipped += 1
                continue

            name = clean_text(unit.get("nome_fantasia")) or clean_text(
                unit.get("nome_razao_social")
            )
            if not name:
                skipped += 1
                continue

            lat = unit.get("latitude_estabelecimento_decimo_grau")
            lng = unit.get("longitude_estabelecimento_decimo_grau")

            saved += 1
            writer.writerow(
                [
                    saved,
                    city_id,
                    name,
                    format_address(
                        unit.get("endereco_estabelecimento"),
                        unit.get("numero_estabelecimento"),
                    )
                    or "",
                    clean_text(unit.get("bairro_estabelecimento")) or "",
                    clean_text(unit.get("numero_telefone_estabelecimento")) or "",
                    clean_text(unit.get("descricao_turno_atendimento")) or "",
                    PNI_BASIC_VACCINES,
                    "" if lat is None else lat,
                    "" if lng is None else lng,
                ]
            )

    print(
        f"Pontos de vacinação salvos em {points_path}: {saved} "
        f"(ignorados/inativos/não-SUS: {skipped}, total bruto CNES: {len(all_units)})"
    )


if __name__ == "__main__":
    city_map = fetch_cities()
    fetch_vaccination_points(city_map)

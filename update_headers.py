import re

with open("src/routes.py", "r", encoding="utf-8") as f:
    code = f.read()

replacement = """
    ref_year = datetime.now().year
    if fh:
        ref_year = fh.year
    elif fd:
        ref_year = fd.year

    meses_headers = []
    for m in MESES_ORDEN:
        if moneda == "usd":
            ym = f"{ref_year}-{m:02d}"
            try:
                trm_val, _ = get_trm_for_date(ym, trm_dict)
                if trm_val:
                    meses_headers.append(f"{MESES[m]}\\n(TRM {int(trm_val)})")
                else:
                    meses_headers.append(MESES[m])
            except:
                meses_headers.append(MESES[m])
        else:
            meses_headers.append(MESES[m])

    header = [T["categoria_sub"]] + meses_headers + [T["consolidado"]]
"""

code = re.sub(r'    header = \[T\["categoria_sub"\]\] \+ \[MESES\[m\] for m in MESES_ORDEN\] \+ \[T\["consolidado"\]\]', replacement.strip('\n'), code)

# Note: Excel uses `headers = ` instead of `header = `. Let's check Excel.
replacement_excel = """
    ref_year = datetime.now().year
    if fh:
        ref_year = fh.year
    elif fd:
        ref_year = fd.year

    meses_headers = []
    for m in MESES_ORDEN:
        if moneda == "usd":
            ym = f"{ref_year}-{m:02d}"
            try:
                trm_val, _ = get_trm_for_date(ym, trm_dict)
                if trm_val:
                    meses_headers.append(f"{MESES[m]}\\n(TRM {int(trm_val)})")
                else:
                    meses_headers.append(MESES[m])
            except:
                meses_headers.append(MESES[m])
        else:
            meses_headers.append(MESES[m])

    headers = [T["categoria_sub"]] + meses_headers + [T["consolidado"]]
"""

code = re.sub(r'    headers = \[T\["categoria_sub"\]\] \+ \[MESES\[m\] for m in MESES_ORDEN\] \+ \[T\["consolidado"\]\]', replacement_excel.strip('\n'), code)


with open("src/routes.py", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated routes.py")

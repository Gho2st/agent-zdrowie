import pandas as pd
from scipy.stats import chi2_contingency

plik_excel = "ankieta.xlsx"

df = pd.read_excel(
    plik_excel, sheet_name="Liczba odpowiedzi 1", usecols=[1, 4]
)  # 1 = Wiek, 4 = Zapisuje wyniki
df.columns = ["Wiek", "Zapisuje wyniki"]

df = df.dropna()

contingency = pd.crosstab(df["Wiek"], df["Zapisuje wyniki"])

print("Tabela kontyngencji: Zapisywanie pomiarów vs Wiek (cała próba)")
print(contingency)

chi2, p, dof, expected = chi2_contingency(contingency)
print(f"χ² = {chi2:.2f}, df = {dof}, p = {p:.3f}")

# Test 2: Nawyk zapisywania pomiarów vs wiek (bez grupy 65+)
df = pd.read_excel(plik_excel, sheet_name="Liczba odpowiedzi 1", usecols=[1, 4])
df.columns = ["Wiek", "Zapisuje wyniki"]

# Wyklucz grupę 65+
df = df[df["Wiek"] != "65+"]
df = df.dropna()

contingency = pd.crosstab(df["Wiek"], df["Zapisuje wyniki"])

print("Tabela kontyngencji: Zapisywanie pomiarów vs Wiek (bez 65+)")
print(contingency)

chi2, p, dof, expected = chi2_contingency(contingency)
print(f"χ² = {chi2:.2f}, df = {dof}, p = {p:.3f}")

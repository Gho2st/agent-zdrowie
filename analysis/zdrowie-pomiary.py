import pandas as pd
from scipy.stats import chi2_contingency

plik_excel = "ankieta.xlsx"

df = pd.read_excel(
    plik_excel, sheet_name="Liczba odpowiedzi 1", usecols=[2, 4]
)  # 2 = Stan zdrowia, 4 = Zapisuje wyniki
df.columns = ["Stan zdrowia", "Zapisuje wyniki"]

df = df.dropna()

contingency = pd.crosstab(df["Stan zdrowia"], df["Zapisuje wyniki"])

print("Tabela kontyngencji: Stan zdrowia vs Zapisywanie pomiarów")
print(contingency)

chi2, p, dof, expected = chi2_contingency(contingency)
print(f"χ² = {chi2:.2f}, df = {dof}, p = {p:.3f}")

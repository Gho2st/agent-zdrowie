import pandas as pd
from scipy.stats import chi2_contingency

plik_excel = "ankieta.xlsx"

# Choroba przewlekła vs zapisywanie pomiarów
df = pd.read_excel(
    plik_excel, sheet_name="Liczba odpowiedzi 1", usecols=[3, 4]
)  # 3 = Choroba przewlekła, 4 = Zapisuje wyniki
df.columns = ["Choroba przewlekła", "Zapisuje wyniki"]

df = df.dropna()

contingency = pd.crosstab(df["Choroba przewlekła"], df["Zapisuje wyniki"])

print("Tabela kontyngencji: Choroba przewlekła vs Zapisywanie pomiarów")
print(contingency)

chi2, p, dof, expected = chi2_contingency(contingency)
print(f"χ² = {chi2:.2f}, df = {dof}, p = {p:.3f}")

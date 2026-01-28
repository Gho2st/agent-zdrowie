import pandas as pd
from scipy.stats import chi2_contingency

plik_excel = "ankieta.xlsx"

df = pd.read_excel(
    plik_excel, sheet_name="Liczba odpowiedzi 1", usecols=[1, 9]
)  # 1 = Wiek, 9 = Ufa Google

df.columns = ["Wiek", "Ufa Google"]

# Dichotomizacja
df["Zaufanie"] = df["Ufa Google"].map(
    {
        "Tak - w pełni": "Pozytywne",
        "Raczej tak": "Pozytywne",
        "Raczej nie": "Negatywne",
        "Nie": "Negatywne",
    }
)

# Tabela kontyngencji i test
contingency = pd.crosstab(df["Wiek"], df["Zaufanie"])

print(
    "Tabela 2. Zaufanie do informacji zdrowotnych z Google według grup wiekowych (N=123)"
)
print(contingency)

chi2, p, dof, expected = chi2_contingency(contingency)
print(f"\nχ² = {chi2:.2f}, df = {dof}, p = {p:.3f}")

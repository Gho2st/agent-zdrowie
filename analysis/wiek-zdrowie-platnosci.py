import pandas as pd
from scipy.stats import chi2_contingency

plik_excel = "ankieta.xlsx"

df = pd.read_excel(
    plik_excel, sheet_name="Liczba odpowiedzi 1", usecols=[1, 18]
)  # 1 = Wiek, 18 = Czy płatna

df.columns = ["Wiek", "Platna"]

# Dichotomizacja: Pozytywne (Tak, Tak jeśli cena, Może) vs Negatywne (Nie)
df["Skłonnosc"] = df["Platna"].map(
    {
        "Tak": "Pozytywne",
        "Tak, jeśli cena byłaby rozsądna": "Pozytywne",
        "Może": "Pozytywne",
        "Nie": "Negatywne",
    }
)

df = df.dropna()

# Tabela kontyngencji i test
contingency = pd.crosstab(df["Wiek"], df["Skłonnosc"])

print(
    "Tabela 1. Skłonność do korzystania z wersji płatnej według grup wiekowych (N=123)"
)
print(contingency)

chi2, p, dof, expected = chi2_contingency(contingency)
print(f"\nχ² = {chi2:.2f}, df = {dof}, p = {p:.3f}")

#  stan zdrowia vs płatna aplikacja
df = pd.read_excel(
    plik_excel, sheet_name="Liczba odpowiedzi 1", usecols=[2, 18]
)  # 2 = Stan zdrowia, 18 = Czy płatna

df.columns = ["Stan_zdrowia", "Platna"]

df["Skłonnosc"] = df["Platna"].map(
    {
        "Tak": "Pozytywne",
        "Tak, jeśli cena byłaby rozsądna": "Pozytywne",
        "Może": "Pozytywne",
        "Nie": "Negatywne",
    }
)

df = df.dropna()

# Tabela kontyngencji i test
contingency = pd.crosstab(df["Stan_zdrowia"], df["Skłonnosc"])

print(
    "\nTabela 2. Skłonność do korzystania z wersji płatnej według stanu zdrowia (N=123)"
)
print(contingency)

chi2, p, dof, expected = chi2_contingency(contingency)
print(f"\nχ² = {chi2:.2f}, df = {dof}, p = {p:.3f}")

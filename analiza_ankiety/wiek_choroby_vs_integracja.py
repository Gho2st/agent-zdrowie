import pandas as pd
from scipy.stats import chi2_contingency

# Skrypt dla wiek vs integracja
plik_excel = 'ankieta.xlsx'

df = pd.read_excel(plik_excel, sheet_name='Liczba odpowiedzi 1', usecols=[1, 19])  # 1 = Wiek, 19 = Integracja

# Nadaj nazwy kolumnom
df.columns = ['Wiek', 'Integracja']

# Dichotomizacja: Pozytywne (Tak, Może) vs Negatywne (Nie)
df['Skłonnosc'] = df['Integracja'].map({
    'Tak, to byłoby bardzo pomocne': 'Pozytywne',
    'Może, jeśli miał(a)bym kontrolę nad tym': 'Pozytywne',
    'Może': 'Pozytywne',
    'Nie, wolę aplikację niezależną': 'Negatywne',
    'Nie': 'Negatywne'
})

# Usuń wiersze z NaN, jeśli istnieją
df = df.dropna()

# Tabela kontyngencji i test
contingency = pd.crosstab(df['Wiek'], df['Skłonnosc'])

print("Tabela 1. Skłonność do integracji z systemami jak Google Fit według grup wiekowych (N=123)")
print(contingency)

chi2, p, dof, expected = chi2_contingency(contingency)
print(f"\nχ² = {chi2:.2f}, df = {dof}, p = {p:.3f}")

# Skrypt dla choroby przewlekłe vs integracja
df = pd.read_excel(plik_excel, sheet_name='Liczba odpowiedzi 1', usecols=[3, 19])  # 3 = Choroby przewlekłe, 19 = Integracja

# Nadaj nazwy kolumnom
df.columns = ['Choroby', 'Integracja']

# Filtruj tylko Tak/Nie, pomiń Wolę nie mówić jeśli występuje
df = df[df['Choroby'].isin(['Tak', 'Nie'])]

# Dichotomizacja integracji taka sama
df['Skłonnosc'] = df['Integracja'].map({
    'Tak, to byłoby bardzo pomocne': 'Pozytywne',
    'Może, jeśli miał(a)bym kontrolę nad tym': 'Pozytywne',
    'Może': 'Pozytywne',
    'Nie, wolę aplikację niezależną': 'Negatywne',
    'Nie': 'Negatywne'
})

# Usuń wiersze z NaN, jeśli istnieją
df = df.dropna()

# Tabela kontyngencji i test
contingency = pd.crosstab(df['Choroby'], df['Skłonnosc'])

print("\nTabela 2. Skłonność do integracji z systemami jak Google Fit według chorób przewlekłych (N=123)")
print(contingency)

chi2, p, dof, expected = chi2_contingency(contingency)
print(f"\nχ² = {chi2:.2f}, df = {dof}, p = {p:.3f}")
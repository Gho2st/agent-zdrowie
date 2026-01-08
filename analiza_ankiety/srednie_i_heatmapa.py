import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Ustawienie globalnego stylu Seaborn z większą bazową czcionką (opcjonalne, ale pomaga)
sns.set(style="whitegrid", rc={"axes.labelsize": 14, "axes.titlesize": 18})

plik_excel = 'ankieta.xlsx'

# Wczytaj tylko potrzebne kolumny
df = pd.read_excel(plik_excel, sheet_name='Liczba odpowiedzi 1', usecols=[1, 11, 12, 13, 14, 15])

df.columns = ['Wiek', 'Dodawanie pomiarów', 'Porównanie do norm', 'Chatbot AI', 'Analiza nastroju', 'Motywacja']

# Konwersja na liczby
rating_cols = ['Dodawanie pomiarów', 'Porównanie do norm', 'Chatbot AI', 'Analiza nastroju', 'Motywacja']
df[rating_cols] = df[rating_cols].apply(pd.to_numeric, errors='coerce')

# Średnie
averages = df.groupby('Wiek')[rating_cols].mean().round(2)
averages.loc['Razem'] = df[rating_cols].mean().round(2)

print("Tabela 1. Średnie oceny przydatności funkcjonalności")
print(averages)

# Heatmapa z większymi czcionkami
plt.figure(figsize=(14, 10))  # trochę większa figura

ax = sns.heatmap(
    averages.drop('Razem'), 
    annot=True, 
    cmap='YlGnBu', 
    fmt='.2f', 
    linewidths=0.5,
    annot_kws={"size": 14},  # rozmiar liczb w komórkach
    cbar_kws={"shrink": 0.8}
)

# Większe czcionki dla tytułów i etykiet
plt.title('Średnie oceny według grup wiekowych', fontsize=20, pad=20)
plt.ylabel('Grupa wiekowa', fontsize=16)
plt.xlabel('Funkcjonalność', fontsize=16)

# Większe czcionki dla etykiet osi X i Y
ax.tick_params(axis='x', labelsize=13, rotation=45)
ax.tick_params(axis='y', labelsize=14)

plt.tight_layout()
plt.savefig('heatmap_srednie_oceny.png', dpi=300, bbox_inches='tight')
plt.show()
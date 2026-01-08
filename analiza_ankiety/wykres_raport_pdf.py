import pandas as pd
import matplotlib.pyplot as plt

plik_excel = 'ankieta.xlsx'

# Kolumny: 2 = Stan zdrowia, 21 = Raport PDF
df = pd.read_excel(plik_excel, sheet_name='Liczba odpowiedzi 1', usecols=[2, 21])

df.columns = ['Stan zdrowia', 'Raport PDF']

# Procent odpowiedzi "Tak – bardzo by mi się to przydało"
very_useful = 'Tak – bardzo by mi się to przydało'
perc = (df['Raport PDF'] == very_useful).groupby(df['Stan zdrowia']).mean() * 100
perc = perc.round(1).sort_values(ascending=False)

print("Odsetek odpowiedzi 'bardzo przydatne' według stanu zdrowia:")
print(perc)

# Wykres
kolory = {'Zły': '#ff6347', 'Przeciętny': '#ffa500', 'Dobry': '#90ee90', 'Bardzo dobry': '#2e8b57'}
bar_colors = [kolory.get(x, '#808080') for x in perc.index]

plt.figure(figsize=(10, 7))
bars = plt.bar(perc.index, perc.values, color=bar_colors, edgecolor='black')
for bar in bars:
    h = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2., h + 1, f'{h:.1f}%', ha='center', va='bottom', fontsize=12, fontweight='bold')

plt.title('Przydatność raportu PDF według stanu zdrowia (N=123)')
plt.ylabel('Odsetek "Tak – bardzo by mi się to przydało" (%)')
plt.ylim(0, 100)
plt.grid(axis='y', linestyle='--', alpha=0.7)
plt.tight_layout()
plt.savefig('wykres_raport_pdf.png', dpi=300)
plt.show()
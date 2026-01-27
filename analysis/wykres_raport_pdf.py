import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# 1. Wczytanie danych
plik = 'ankieta.xlsx'
df = pd.read_excel(plik, sheet_name='Liczba odpowiedzi 1')

stan_zdrowia_col = df.columns[2]
raport_pdf_col = df.columns[21]

# 2. Przygotowanie danych
grouped = df.groupby([stan_zdrowia_col, raport_pdf_col]).size().unstack(fill_value=0)
perc = grouped.div(grouped.sum(axis=1), axis=0) * 100
perc = perc.round(1)
perc['N'] = grouped.sum(axis=1)

order = ['Zły', 'Przeciętny', 'Dobry', 'Bardzo dobry']
perc = perc.reindex(order)

answer_order = [
    'Tak – bardzo by mi się to przydało',
    'Może – zależy, jak byłoby to zrobione',
    'Raczej nie potrzebuję',
    'Nie'
]

data_for_plot = perc[answer_order]

# 3. Kolory
colors = ['#006D77', '#83C5BE', '#FF9F1C', '#D00000']

# 4. Wykres – ręczne rysowanie słupków 
fig, ax = plt.subplots(figsize=(10, 6.5))

# Pozycje dla grup (odstępy między kategoriami zdrowia)
n_groups = len(data_for_plot)
n_bars = len(answer_order)
bar_height = 0.8  # grubość pojedynczego słupka
group_gap = 1.2   # dodatkowy odstęp między grupami zdrowia

# Obliczamy pozycje Y dla każdej grupy i słupka
indices = np.arange(n_groups) * (n_bars * bar_height + group_gap)

for i, col in enumerate(answer_order):
    y_pos = indices + i * bar_height
    ax.barh(y_pos, data_for_plot[col], height=bar_height,
            color=colors[i], edgecolor='white', linewidth=1.2, label=col)

# 5. Etykiety procentowe
for i, col in enumerate(answer_order):
    y_pos = indices + i * bar_height
    for j, val in enumerate(data_for_plot[col]):
        if val > 4:
            ax.text(val + 0.8, y_pos[j],
                    f'{val:.1f}%',
                    va='center', ha='left',
                    fontsize=10.5, fontweight='bold', color='#333333')

# 6. Liczebność N
for i, idx in enumerate(data_for_plot.index):
    n_value = int(perc.loc[idx, 'N'])
    # Środek grupy (pionowo)
    group_center = indices[i] + (n_bars * bar_height) / 2 - bar_height / 2
    ax.text(101, group_center, f'N = {n_value}',
            va='center', ha='left',
            fontsize=11, fontweight='bold', color='#333333')

# 7. Stylizacja
ax.set_title('Przydatność funkcji generowania raportu PDF dla lekarza\nw zależności od samooceny stanu zdrowia (całkowita N = 123)',
             fontsize=14.5, fontweight='bold', pad=25)

ax.set_xlabel('Odsetek odpowiedzi (%)', fontsize=12)
ax.set_ylabel('Samoocena stanu zdrowia', fontsize=12)

ax.set_yticks(indices + (n_bars * bar_height) / 2 - bar_height / 2)
ax.set_yticklabels(data_for_plot.index, fontsize=11.5)

ax.tick_params(axis='x', labelsize=10.5)
ax.set_xlim(0, 100)
ax.xaxis.set_major_locator(plt.MultipleLocator(10))
ax.grid(axis='x', linestyle='--', alpha=0.4, color='gray')

ax.invert_yaxis()

# Legenda pod wykresem
ax.legend(title='Odpowiedź',
          fontsize=10.5, title_fontsize=11.5,
          loc='upper center', bbox_to_anchor=(0.5, -0.18),
          ncol=2, frameon=False)

sns.despine(left=True, bottom=True)
plt.subplots_adjust(bottom=0.28)
plt.tight_layout()

plt.savefig('rycina_raport_pdf.png', dpi=400, bbox_inches='tight')
plt.show()
interface NavigationProps {
  onScreenChange: (screen: string) => void;
  activeScreen: string;
}

export default function Navigation({
  onScreenChange,
  activeScreen,
}: NavigationProps) {
  const menuItems = [
    "Podsumowanie",
    "Pomiary",
    "Profil",
    "Statystyki",
    "Agent AI",
  ];

  return (
    <aside className="flex flex-col justify-between w-3/12 px-8 py-10 h-screen">
      <div className="text-4xl font-bold">Agent Zdrowie</div>
      <nav>
        <ul className="flex flex-col gap-6 text-lg font-medium">
          {menuItems.map((item) => (
            <li
              key={item}
              className={`cursor-pointer ${
                activeScreen === item ? "text-blue-600" : "hover:text-blue-600"
              }`}
              onClick={() => onScreenChange(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <p className="mb-10 text-2xl font-bold">Raport PDF</p>
        <button className="bg-green-500 w-full py-5 rounded-3xl text-2xl font-bold">
          Pobierz
        </button>
      </div>
    </aside>
  );
}

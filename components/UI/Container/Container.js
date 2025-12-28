export default function Container({ children }) {
  return (
    <main className="px-[7%] py-24 overflow-hidden pb-16  min-h-[100vh] bg-gradient-to-br from-blue-100 via-blue-200 to-purple-200 shadow-2xl ">
      <div>{children}</div>
    </main>
  );
}

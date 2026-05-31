import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import CrimeaMap from "@/components/CrimeaMap";

type Screen = "home" | "new-order" | "offers" | "chat" | "courier-register";
type UserRole = "customer" | "courier" | null;
type MapPoint = { lat: number; lng: number } | null;

const MOCK_OFFERS = [
  { id: 1, name: "Алексей К.", rating: 4.9, trips: 312, price: 350, time: "~20 мин", comment: "Заберу сразу, машина грузовая" },
  { id: 2, name: "Марина В.", rating: 4.7, trips: 178, price: 400, time: "~15 мин", comment: "Еду мимо, подхвачу по пути" },
  { id: 3, name: "Дмитрий Р.", rating: 5.0, trips: 540, price: 500, time: "~10 мин", comment: "Срочно могу, жду у точки А" },
];

const MOCK_MESSAGES = [
  { id: 1, from: "courier", text: "Привет! Готов взять заказ, уточните адрес точнее?" },
  { id: 2, from: "customer", text: "Да, это возле магазина Магнит на Ленина 12" },
  { id: 3, from: "courier", text: "Понял, буду через 15 минут" },
];

export default function Index() {
  const [screen, setScreen] = useState<Screen>("home");
  const [role, setRole] = useState<UserRole>(null);
  const [orderPrice, setOrderPrice] = useState("300");
  const [comment, setComment] = useState("");
  const [pointA, setPointA] = useState<MapPoint>(null);
  const [pointB, setPointB] = useState<MapPoint>(null);
  const [selectingPoint, setSelectingPoint] = useState<"A" | "B" | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [bargainMode, setBargainMode] = useState<number | null>(null);
  const [bargainPrice, setBargainPrice] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [addressA, setAddressA] = useState("");
  const [addressB, setAddressB] = useState("");
  const [suggestionsA, setSuggestionsA] = useState<{display_name: string; lat: string; lon: string}[]>([]);
  const [suggestionsB, setSuggestionsB] = useState<{display_name: string; lat: string; lon: string}[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [flyTo, setFlyTo] = useState<{lat: number; lng: number} | null>(null);
  const timerA = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerB = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [regStep, setRegStep] = useState(1);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [passportSeries, setPassportSeries] = useState("");
  const [passportNumber, setPassportNumber] = useState("");

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    if (!selectingPoint) return;
    if (selectingPoint === "A") {
      setPointA(latlng);
      reverseGeocode(latlng, setAddressA);
    } else {
      setPointB(latlng);
      reverseGeocode(latlng, setAddressB);
    }
    setSelectingPoint(null);
  };

  const reverseGeocode = async (latlng: { lat: number; lng: number }, setter: (v: string) => void) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json&accept-language=ru`,
        { headers: { "Accept-Language": "ru" } }
      );
      const data = await res.json();
      if (data.display_name) {
        const parts = data.display_name.split(",");
        setter(parts.slice(0, 3).join(", "));
      }
    } catch { /* silent */ }
  };

  const searchAddress = async (query: string, point: "A" | "B") => {
    if (query.length < 3) {
      if (point === "A") setSuggestionsA([]); else setSuggestionsB([]);
      return;
    }
    if (point === "A") setLoadingA(true); else setLoadingB(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + " Крым")}&format=json&limit=5&accept-language=ru`,
        { headers: { "Accept-Language": "ru" } }
      );
      const data = await res.json();
      if (point === "A") setSuggestionsA(data); else setSuggestionsB(data);
    } catch { /* silent */ }
    if (point === "A") setLoadingA(false); else setLoadingB(false);
  };

  const handleAddressInput = (value: string, point: "A" | "B") => {
    if (point === "A") { setAddressA(value); }
    else { setAddressB(value); }
    const timer = point === "A" ? timerA : timerB;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => searchAddress(value, point), 500);
  };

  const selectSuggestion = (s: { display_name: string; lat: string; lon: string }, point: "A" | "B") => {
    const latlng = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    const label = s.display_name.split(",").slice(0, 3).join(", ");
    if (point === "A") {
      setPointA(latlng);
      setAddressA(label);
      setSuggestionsA([]);
    } else {
      setPointB(latlng);
      setAddressB(label);
      setSuggestionsB([]);
    }
    setFlyTo(latlng);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, { id: messages.length + 1, from: "customer", text: newMessage }]);
    setNewMessage("");
  };

  const goHome = () => {
    setScreen("home");
    setSelectedOffer(null);
    setBargainMode(null);
  };

  // ——— HOME ———
  if (screen === "home") {
    return (
      <div className="min-h-screen hero-gradient flex flex-col">
        <header className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange rounded-lg flex items-center justify-center orange-glow">
              <Icon name="Truck" size={16} className="text-white" />
            </div>
            <span className="font-display text-xl text-white tracking-wider">КУРЬЕРГО</span>
          </div>
          {role && (
            <button
              onClick={() => setRole(null)}
              className="text-xs px-3 py-1 rounded-full border border-[var(--brand-border)] text-[var(--brand-text-muted)] hover:border-orange hover:text-orange transition-colors"
            >
              Сменить роль
            </button>
          )}
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-10 animate-fade-in">
          {!role ? (
            <>
              <div className="mb-8 text-center">
                <div className="w-full max-w-xs mx-auto mb-6 rounded-2xl overflow-hidden" style={{ height: 180 }}>
                  <img
                    src="https://cdn.poehali.dev/projects/056e4e82-12f2-4413-9ea5-edd8fba6a2ca/files/26a1fe56-e244-4d38-b458-020d55fef1f9.jpg"
                    alt="КурьерГо доставка"
                    className="w-full h-full object-cover"
                    style={{ filter: "brightness(0.85) saturate(1.2)" }}
                  />
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-dim border border-orange mb-4">
                  <span className="status-dot bg-orange pulse-orange"></span>
                  <span className="text-xs text-orange font-medium">Сервис работает</span>
                </div>
                <h1 className="font-display text-5xl md:text-6xl text-white leading-tight mb-4">
                  ДОСТАВКА<br />
                  <span className="text-orange">РЯДОМ</span>
                </h1>
                <p className="text-[var(--brand-text-muted)] text-base max-w-xs mx-auto leading-relaxed">
                  Найди курьера или стань им. Свои условия, честная цена.
                </p>
              </div>

              <div className="w-full max-w-sm space-y-3">
                <button
                  onClick={() => setRole("customer")}
                  className="w-full py-4 bg-orange text-white font-semibold rounded-xl text-base flex items-center justify-center gap-3 orange-glow hover:brightness-110 transition-all"
                >
                  <Icon name="ShoppingBag" size={20} />
                  Я заказчик — нужна доставка
                </button>
                <button
                  onClick={() => setRole("courier")}
                  className="w-full py-4 glass-card text-white font-semibold rounded-xl text-base flex items-center justify-center gap-3 hover:border-orange transition-all"
                >
                  <Icon name="Bike" size={20} />
                  Я курьер — ищу заказы
                </button>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-3 w-full max-w-sm">
                {[
                  { icon: "MapPin", label: "Любая точка", sub: "без адреса" },
                  { icon: "DollarSign", label: "Своя цена", sub: "торг уместен" },
                  { icon: "Shield", label: "Верификация", sub: "курьеров" },
                ].map((f) => (
                  <div key={f.label} className="glass-card rounded-xl p-3 text-center">
                    <Icon name={f.icon} size={20} className="text-orange mx-auto mb-1" />
                    <div className="text-xs font-semibold text-white">{f.label}</div>
                    <div className="text-[10px] text-[var(--brand-text-muted)]">{f.sub}</div>
                  </div>
                ))}
              </div>
            </>
          ) : role === "customer" ? (
            <div className="w-full max-w-sm animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-dim border border-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="ShoppingBag" size={28} className="text-orange" />
                </div>
                <h2 className="font-display text-3xl text-white mb-1">ЗАКАЗЧИК</h2>
                <p className="text-[var(--brand-text-muted)] text-sm">Что хотите сделать?</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setScreen("new-order")}
                  className="w-full py-4 bg-orange text-white font-semibold rounded-xl text-base flex items-center justify-center gap-3 orange-glow hover:brightness-110 transition-all"
                >
                  <Icon name="Plus" size={20} />
                  Создать заявку
                </button>
                <button
                  onClick={() => setScreen("offers")}
                  className="w-full py-4 glass-card text-white font-semibold rounded-xl text-base flex items-center justify-center gap-3 hover:border-orange transition-all"
                >
                  <Icon name="List" size={20} />
                  Мои заявки
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-sm animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-dim border border-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="Bike" size={28} className="text-orange" />
                </div>
                <h2 className="font-display text-3xl text-white mb-1">КУРЬЕР</h2>
                <p className="text-[var(--brand-text-muted)] text-sm">Что хотите сделать?</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setScreen("offers")}
                  className="w-full py-4 bg-orange text-white font-semibold rounded-xl text-base flex items-center justify-center gap-3 orange-glow hover:brightness-110 transition-all"
                >
                  <Icon name="Search" size={20} />
                  Найти заказы
                </button>
                <button
                  onClick={() => setScreen("courier-register")}
                  className="w-full py-4 glass-card text-white font-semibold rounded-xl text-base flex items-center justify-center gap-3 hover:border-orange transition-all"
                >
                  <Icon name="UserCheck" size={20} />
                  Регистрация / Профиль
                </button>
              </div>
            </div>
          )}
        </div>

        {role && (
          <nav className="glass-card border-t border-[var(--brand-border)] px-4 py-3 flex items-center justify-around">
            {[
              { icon: "Home", label: "Главная", s: "home" },
              { icon: "Plus", label: "Заявка", s: "new-order" },
              { icon: "List", label: "Заказы", s: "offers" },
              { icon: "MessageCircle", label: "Чат", s: "chat" },
            ].map((n) => (
              <button
                key={n.s}
                onClick={() => setScreen(n.s as Screen)}
                className={`flex flex-col items-center gap-1 transition-colors ${screen === n.s ? "text-orange" : "text-[var(--brand-text-muted)] hover:text-orange"}`}
              >
                <Icon name={n.icon} size={20} />
                <span className="text-[10px]">{n.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    );
  }

  // ——— NEW ORDER ———
  if (screen === "new-order") {
    return (
      <div className="min-h-screen" style={{ background: "var(--brand-blue)" }}>
        <header className="flex items-center gap-3 px-4 py-4 border-b border-[var(--brand-border)]">
          <button onClick={goHome} className="w-9 h-9 glass-card rounded-xl flex items-center justify-center hover:border-orange transition-colors">
            <Icon name="ArrowLeft" size={18} className="text-white" />
          </button>
          <div>
            <h1 className="font-display text-xl text-white">СОЗДАНИЕ ЗАЯВКИ</h1>
            <p className="text-[var(--brand-text-muted)] text-xs">Укажите маршрут и условия</p>
          </div>
        </header>

        <div className="px-4 pb-32 space-y-4 mt-4 animate-fade-in">
          {/* Map */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Icon name="Map" size={16} className="text-orange" />
                Карта маршрута
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectingPoint("A")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectingPoint === "A"
                      ? "bg-orange text-white orange-glow"
                      : pointA
                      ? "bg-green-500/20 text-green-400 border border-green-500/40"
                      : "bg-[var(--brand-surface)] text-[var(--brand-text-muted)] border border-[var(--brand-border)]"
                  }`}
                >
                  {pointA ? "✓ Точка А" : selectingPoint === "A" ? "Кликни на карту" : "Точка А"}
                </button>
                <button
                  onClick={() => setSelectingPoint("B")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectingPoint === "B"
                      ? "bg-orange text-white orange-glow"
                      : pointB
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                      : "bg-[var(--brand-surface)] text-[var(--brand-text-muted)] border border-[var(--brand-border)]"
                  }`}
                >
                  {pointB ? "✓ Точка Б" : selectingPoint === "B" ? "Кликни на карту" : "Точка Б"}
                </button>
              </div>
            </div>

            {/* Address inputs */}
            <div className="px-4 pb-3 space-y-2">
              {/* Point A */}
              <div className="relative">
                <div className="flex items-center gap-2 bg-[var(--brand-surface)] border border-[var(--brand-border)] rounded-xl px-3 py-2.5 focus-within:border-green-500 transition-colors">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold">А</div>
                  <input
                    type="text"
                    value={addressA}
                    onChange={(e) => handleAddressInput(e.target.value, "A")}
                    onFocus={() => setSelectingPoint("A")}
                    placeholder="Откуда забрать..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-[var(--brand-text-muted)] focus:outline-none"
                  />
                  {loadingA && <div className="w-4 h-4 border-2 border-orange border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                  {pointA && !loadingA && <Icon name="CheckCircle" size={14} className="text-green-400 flex-shrink-0" />}
                </div>
                {suggestionsA.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 glass-card border border-[var(--brand-border)] rounded-xl overflow-hidden z-[2000] shadow-xl">
                    {suggestionsA.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => selectSuggestion(s, "A")}
                        className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-[var(--brand-surface)] transition-colors border-b border-[var(--brand-border)] last:border-0 flex items-start gap-2"
                      >
                        <Icon name="MapPin" size={13} className="text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-xs leading-relaxed">{s.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Route connector */}
              <div className="flex items-center gap-2 px-3">
                <div className="w-6 flex justify-center">
                  <div className="w-0.5 h-4 bg-[var(--brand-border)]" />
                </div>
                <span className="text-[10px] text-[var(--brand-text-muted)]">маршрут</span>
              </div>

              {/* Point B */}
              <div className="relative">
                <div className="flex items-center gap-2 bg-[var(--brand-surface)] border border-[var(--brand-border)] rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition-colors">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold">Б</div>
                  <input
                    type="text"
                    value={addressB}
                    onChange={(e) => handleAddressInput(e.target.value, "B")}
                    onFocus={() => setSelectingPoint("B")}
                    placeholder="Куда доставить..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-[var(--brand-text-muted)] focus:outline-none"
                  />
                  {loadingB && <div className="w-4 h-4 border-2 border-orange border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                  {pointB && !loadingB && <Icon name="CheckCircle" size={14} className="text-blue-400 flex-shrink-0" />}
                </div>
                {suggestionsB.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 glass-card border border-[var(--brand-border)] rounded-xl overflow-hidden z-[2000] shadow-xl">
                    {suggestionsB.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => selectSuggestion(s, "B")}
                        className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-[var(--brand-surface)] transition-colors border-b border-[var(--brand-border)] last:border-0 flex items-start gap-2"
                      >
                        <Icon name="MapPin" size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-xs leading-relaxed">{s.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              {selectingPoint && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                  <div className="glass-card px-4 py-2 rounded-xl border border-orange shadow-lg">
                    <span className="text-orange text-sm font-semibold">Кликните на карту — точка {selectingPoint}</span>
                  </div>
                </div>
              )}
              <CrimeaMap
                pointA={pointA}
                pointB={pointB}
                selectingPoint={selectingPoint}
                onMapClick={handleMapClick}
                flyToPoint={flyTo}
              />
            </div>
          </div>

          {/* Price */}
          <div className="glass-card rounded-2xl p-4">
            <label className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Icon name="DollarSign" size={16} className="text-orange" />
              Ваша цена (₽)
            </label>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setOrderPrice(String(Math.max(50, Number(orderPrice) - 50)))}
                className="w-10 h-10 glass-card rounded-xl flex items-center justify-center hover:border-orange transition-colors text-white font-bold text-lg"
              >−</button>
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(e.target.value)}
                  className="w-full bg-[var(--brand-surface)] border border-[var(--brand-border)] rounded-xl px-4 py-3 text-center text-2xl font-display text-orange focus:outline-none focus:border-orange"
                />
              </div>
              <button
                onClick={() => setOrderPrice(String(Number(orderPrice) + 50))}
                className="w-10 h-10 glass-card rounded-xl flex items-center justify-center hover:border-orange transition-colors text-white font-bold text-lg"
              >+</button>
            </div>
            <div className="flex gap-2 mt-3">
              {[150, 300, 500, 1000].map((p) => (
                <button
                  key={p}
                  onClick={() => setOrderPrice(String(p))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${orderPrice === String(p) ? "bg-orange text-white" : "bg-[var(--brand-surface)] text-[var(--brand-text-muted)] hover:text-orange"}`}
                >
                  {p}₽
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="glass-card rounded-2xl p-4">
            <label className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Icon name="MessageSquare" size={16} className="text-orange" />
              Комментарий
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Уточните детали: что везти, ориентиры, особые условия..."
              rows={3}
              className="w-full mt-2 bg-[var(--brand-surface)] border border-[var(--brand-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--brand-text-muted)] focus:outline-none focus:border-orange resize-none"
            />
          </div>

          {/* Contacts */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <Icon name="Phone" size={16} className="text-orange" />
              Контакты для курьера
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Номер телефона"
              className="w-full bg-[var(--brand-surface)] border border-[var(--brand-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--brand-text-muted)] focus:outline-none focus:border-orange"
            />
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Ссылка на соцсеть (Telegram, ВКонтакте...)"
              className="w-full bg-[var(--brand-surface)] border border-[var(--brand-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--brand-text-muted)] focus:outline-none focus:border-orange"
            />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: "linear-gradient(to top, var(--brand-blue) 60%, transparent)" }}>
          <button
            onClick={() => setScreen("offers")}
            className="w-full py-4 bg-orange text-white font-bold rounded-xl text-base flex items-center justify-center gap-3 orange-glow hover:brightness-110 transition-all"
          >
            <Icon name="Send" size={20} />
            Опубликовать заявку
          </button>
        </div>
      </div>
    );
  }

  // ——— OFFERS ———
  if (screen === "offers") {
    return (
      <div className="min-h-screen" style={{ background: "var(--brand-blue)" }}>
        <header className="flex items-center gap-3 px-4 py-4 border-b border-[var(--brand-border)]">
          <button onClick={goHome} className="w-9 h-9 glass-card rounded-xl flex items-center justify-center hover:border-orange transition-colors">
            <Icon name="ArrowLeft" size={18} className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl text-white">
              {role === "courier" ? "ДОСТУПНЫЕ ЗАКАЗЫ" : "ПРЕДЛОЖЕНИЯ КУРЬЕРОВ"}
            </h1>
            <p className="text-[var(--brand-text-muted)] text-xs">
              {role === "courier" ? "Выберите и сделайте ставку" : "3 курьера готовы взять заказ"}
            </p>
          </div>
          <div className="px-3 py-1 bg-orange-dim border border-orange rounded-full">
            <span className="text-orange text-xs font-semibold">3 активных</span>
          </div>
        </header>

        {role === "customer" && (
          <div className="mx-4 mt-4 glass-card rounded-2xl p-4 border-l-4 border-orange animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--brand-text-muted)] mb-1">Ваша заявка</div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span className="text-sm text-white">Точка А</span>
                  </div>
                  <Icon name="ArrowRight" size={14} className="text-[var(--brand-text-muted)]" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-white">Точка Б</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl text-orange">{orderPrice}₽</div>
                <div className="text-[10px] text-[var(--brand-text-muted)]">ваша цена</div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 mt-4 pb-6 space-y-3 animate-slide-up">
          {MOCK_OFFERS.map((offer) => (
            <div
              key={offer.id}
              className={`glass-card rounded-2xl p-4 card-hover ${selectedOffer === offer.id ? "border-orange orange-glow" : ""}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange/30 to-orange/10 border border-orange/30 flex items-center justify-center">
                    <Icon name="User" size={20} className="text-orange" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{offer.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1">
                        <Icon name="Star" size={11} className="text-yellow-400" />
                        <span className="text-xs text-yellow-400">{offer.rating}</span>
                      </div>
                      <span className="text-[var(--brand-text-muted)] text-xs">·</span>
                      <span className="text-xs text-[var(--brand-text-muted)]">{offer.trips} доставок</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl text-orange">{offer.price}₽</div>
                  <div className="text-xs text-[var(--brand-text-muted)]">{offer.time}</div>
                </div>
              </div>

              <div className="text-xs text-[var(--brand-text-muted)] mb-3 italic">"{offer.comment}"</div>

              {bargainMode === offer.id ? (
                <div className="flex gap-2 animate-fade-in">
                  <input
                    type="number"
                    value={bargainPrice}
                    onChange={(e) => setBargainPrice(e.target.value)}
                    placeholder="Предложите цену..."
                    className="flex-1 bg-[var(--brand-surface)] border border-[var(--brand-border)] rounded-xl px-3 py-2 text-sm text-white placeholder-[var(--brand-text-muted)] focus:outline-none focus:border-orange"
                  />
                  <button
                    onClick={() => setBargainMode(null)}
                    className="px-4 py-2 bg-orange text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all"
                  >
                    Отправить
                  </button>
                  <button
                    onClick={() => setBargainMode(null)}
                    className="px-3 py-2 glass-card text-[var(--brand-text-muted)] text-sm rounded-xl hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setBargainMode(offer.id); setBargainPrice(""); }}
                    className="flex-1 py-2 border border-[var(--brand-border)] rounded-xl text-xs font-semibold text-[var(--brand-text-muted)] hover:border-orange hover:text-orange transition-all flex items-center justify-center gap-1.5"
                  >
                    <Icon name="TrendingDown" size={13} />
                    {role === "courier" ? "Предложить цену" : "Торговаться"}
                  </button>
                  <button
                    onClick={() => { setSelectedOffer(offer.id); setScreen("chat"); }}
                    className="flex-1 py-2 bg-orange text-white rounded-xl text-xs font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Icon name={role === "courier" ? "Package" : "CheckCircle"} size={13} />
                    {role === "courier" ? "Взять заказ" : "Выбрать"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ——— CHAT ———
  if (screen === "chat") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--brand-blue)" }}>
        <header className="flex items-center gap-3 px-4 py-4 border-b border-[var(--brand-border)]">
          <button onClick={() => setScreen("offers")} className="w-9 h-9 glass-card rounded-xl flex items-center justify-center hover:border-orange transition-colors">
            <Icon name="ArrowLeft" size={18} className="text-white" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange/30 to-orange/10 border border-orange/30 flex items-center justify-center">
            <Icon name="User" size={18} className="text-orange" />
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold text-sm">
              {role === "customer" ? "Алексей К." : "Заказчик #1847"}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="status-dot bg-green-400 pulse-orange"></span>
              <span className="text-xs text-green-400">онлайн</span>
            </div>
          </div>
          <div className="glass-card px-3 py-1.5 rounded-xl border border-orange">
            <span className="font-display text-orange text-sm">{orderPrice}₽</span>
          </div>
        </header>

        <div className="mx-4 mt-3 bg-orange-dim border border-orange/30 rounded-xl p-3 flex items-center gap-3">
          <Icon name="Navigation" size={16} className="text-orange flex-shrink-0" />
          <div className="text-xs text-[var(--brand-text-muted)]">
            <span className="text-green-400">Точка А</span>
            <span className="mx-2">→</span>
            <span className="text-blue-400">Точка Б</span>
            {comment && <span className="ml-2 text-white/50">· {comment.slice(0, 30)}</span>}
          </div>
        </div>

        <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto animate-fade-in">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === "customer" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                  msg.from === "customer"
                    ? "bg-orange text-white rounded-br-sm"
                    : "glass-card text-white rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-6 pt-2 border-t border-[var(--brand-border)]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Написать сообщение..."
              className="flex-1 bg-[var(--brand-surface)] border border-[var(--brand-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--brand-text-muted)] focus:outline-none focus:border-orange"
            />
            <button
              onClick={sendMessage}
              className="w-11 h-11 bg-orange rounded-xl flex items-center justify-center hover:brightness-110 transition-all orange-glow"
            >
              <Icon name="Send" size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ——— COURIER REGISTRATION ———
  if (screen === "courier-register") {
    return (
      <div className="min-h-screen" style={{ background: "var(--brand-blue)" }}>
        <header className="flex items-center gap-3 px-4 py-4 border-b border-[var(--brand-border)]">
          <button onClick={goHome} className="w-9 h-9 glass-card rounded-xl flex items-center justify-center hover:border-orange transition-colors">
            <Icon name="ArrowLeft" size={18} className="text-white" />
          </button>
          <div>
            <h1 className="font-display text-xl text-white">РЕГИСТРАЦИЯ КУРЬЕРА</h1>
            <p className="text-[var(--brand-text-muted)] text-xs">Верификация личности</p>
          </div>
        </header>

        <div className="px-4 mt-4">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2 flex-1 last:flex-none">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    regStep >= step ? "bg-orange text-white orange-glow" : "glass-card text-[var(--brand-text-muted)] border border-[var(--brand-border)]"
                  }`}
                >
                  {regStep > step ? <Icon name="Check" size={14} /> : step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-0.5 transition-all ${regStep > step ? "bg-orange" : "bg-[var(--brand-border)]"}`} />
                )}
              </div>
            ))}
          </div>

          {regStep === 1 && (
            <div className="animate-slide-up space-y-4">
              <div className="glass-card rounded-2xl p-5">
                <h2 className="font-display text-lg text-white mb-1">ЛИЧНЫЕ ДАННЫЕ</h2>
                <p className="text-[var(--brand-text-muted)] text-xs mb-4">Шаг 1 из 3</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--brand-text-muted)] mb-1.5 block">Имя и фамилия</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Иван Петров"
                      className="w-full bg-[var(--brand-surface)] border border-[var(--brand-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--brand-text-muted)] focus:outline-none focus:border-orange"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--brand-text-muted)] mb-1.5 block">Номер телефона</label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+7 (___) ___-__-__"
                      className="w-full bg-[var(--brand-surface)] border border-[var(--brand-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--brand-text-muted)] focus:outline-none focus:border-orange"
                    />
                  </div>
                </div>
              </div>
              <button onClick={() => setRegStep(2)} className="w-full py-4 bg-orange text-white font-bold rounded-xl text-base orange-glow hover:brightness-110 transition-all">
                Продолжить
              </button>
            </div>
          )}

          {regStep === 2 && (
            <div className="animate-slide-up space-y-4">
              <div className="glass-card rounded-2xl p-5">
                <h2 className="font-display text-lg text-white mb-1">ПАСПОРТНЫЕ ДАННЫЕ</h2>
                <p className="text-[var(--brand-text-muted)] text-xs mb-4">Шаг 2 из 3</p>
                <div className="bg-orange-dim border border-orange/30 rounded-xl p-3 mb-4 flex gap-3">
                  <Icon name="Shield" size={16} className="text-orange flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--brand-text-muted)]">
                    Верификация нужна для безопасности заказчиков. Данные хранятся зашифровано и не передаются третьим лицам.
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--brand-text-muted)] mb-1.5 block">Серия паспорта</label>
                    <input
                      type="text"
                      value={passportSeries}
                      onChange={(e) => setPassportSeries(e.target.value)}
                      placeholder="0000"
                      maxLength={4}
                      className="w-full bg-[var(--brand-surface)] border border-[var(--brand-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--brand-text-muted)] focus:outline-none focus:border-orange tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--brand-text-muted)] mb-1.5 block">Номер паспорта</label>
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full bg-[var(--brand-surface)] border border-[var(--brand-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--brand-text-muted)] focus:outline-none focus:border-orange tracking-widest"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRegStep(1)} className="flex-1 py-4 glass-card text-[var(--brand-text-muted)] font-bold rounded-xl hover:text-white hover:border-orange transition-all">Назад</button>
                <button onClick={() => setRegStep(3)} className="flex-1 py-4 bg-orange text-white font-bold rounded-xl orange-glow hover:brightness-110 transition-all">Продолжить</button>
              </div>
            </div>
          )}

          {regStep === 3 && (
            <div className="animate-slide-up space-y-4">
              <div className="glass-card rounded-2xl p-5 text-center">
                <div className="w-20 h-20 bg-orange-dim border border-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="Camera" size={32} className="text-orange" />
                </div>
                <h2 className="font-display text-lg text-white mb-1">ФОТО ПАСПОРТА</h2>
                <p className="text-[var(--brand-text-muted)] text-xs mb-4">Шаг 3 из 3</p>
                <p className="text-sm text-[var(--brand-text-muted)] mb-5 leading-relaxed">
                  Сделайте фото разворота паспорта (страница с фото). Убедитесь, что данные хорошо видны.
                </p>
                <button className="w-full py-3 border-2 border-dashed border-[var(--brand-border)] rounded-xl text-[var(--brand-text-muted)] text-sm hover:border-orange hover:text-orange transition-all flex items-center justify-center gap-2">
                  <Icon name="Upload" size={16} />
                  Загрузить фото
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRegStep(2)} className="flex-1 py-4 glass-card text-[var(--brand-text-muted)] font-bold rounded-xl hover:text-white hover:border-orange transition-all">Назад</button>
                <button onClick={goHome} className="flex-1 py-4 bg-orange text-white font-bold rounded-xl orange-glow hover:brightness-110 transition-all">Отправить</button>
              </div>
              <p className="text-center text-xs text-[var(--brand-text-muted)]">Проверка занимает до 24 часов</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
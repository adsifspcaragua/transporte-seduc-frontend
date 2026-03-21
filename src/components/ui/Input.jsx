export default function Input({ label, value, onChange, type, placeholder }) {
  return (
    <div className="relative">
      <label name={value} className="absolute top-[50%] left-8 translate-[0,-50%]">
        {label}
      </label>

      <input className="px-8 py-3 w-96 uppercase focus:outline-none shadow-lg rounded-3xl bg-brand-700 placeholder:text-white/35 text-white"
        placeholder={placeholder}
        type={type}
        value={value}
        name={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
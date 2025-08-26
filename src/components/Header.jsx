// e.g. /components/Header.jsx
import Link from 'next/link';

export default function Header() {
  return (
    <nav className="p-4 bg-gray-100 flex justify-between">
      <Link href="/">
        <a className="font-bold">Home</a>
      </Link>
      <Link href="/admin">
        <a className="font-bold text-blue-600">Admin</a>
      </Link>
    </nav>
  );
}

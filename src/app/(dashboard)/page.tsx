'use client';

import { useState } from "react";
import { FiLogOut } from "react-icons/fi";

import Button from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function Dashboard() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      await signOut();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        uppercase={false}
        fullWidth={false}
        loading={loading}
        leftIcon={<FiLogOut />}
        onClick={handleLogout}
      >
        Sair
      </Button>
    </div>
  );
}

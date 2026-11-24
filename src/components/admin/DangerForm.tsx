"use client";

import { useState, type ReactNode } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  children: ReactNode;
  className?: string;
};

/** Formulário com confirmação antes de excluir/alterar algo sensível. */
export default function DangerForm({
  action,
  confirmMessage,
  children,
  className = "",
}: Props) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}

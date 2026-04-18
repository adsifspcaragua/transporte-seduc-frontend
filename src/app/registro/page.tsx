"use client";

import { useState } from "react";
import RegisterLayout from "@/components/layouts/Register";
import Input from "@/components/ui/Input";
import Register from "@/components/layouts/Register";
import { BiIdCard, BiSolidFileDoc } from "react-icons/bi";
import { FaPeopleRoof } from "react-icons/fa6";

export default function RegistroPage() {
  const [step, setStep] = useState(0);

  const [formData, setFormData] = useState({
    nome: "",
    nascimento: "",
    mae: "",
    pai: "",
    cpf: "",
    rg: "",
    orgao: "",
  });

  function handleNext() {
    setStep((prev) => prev + 1);
  }

  return (
    <Register step={step}>
      <form className="flex flex-col gap-6">
        {/* STEP 1 */}
        {step === 0 && (
          <div className="rounded-xl bg-white p-8 shadow-sm">
            {/* DADOS PESSOAIS */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-brand-600 flex gap-3 ">
                <BiIdCard size={36} />
                <span className="self-center">Dados pessoais</span>
              </h2>

              <div className="flex flex-col gap-4">
                <Input
                  className="rounded-2xl"
                  variant="white"
                  label="Nome completo"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                />

                <Input
                  className="rounded-2xl"
                  variant="white"
                  label="Data de nascimento"
                  value={formData.nascimento}
                  onChange={(e) =>
                    setFormData({ ...formData, nascimento: e.target.value })
                  }
                />
              </div>
            </div>

            {/* DIVISOR */}
            <div className="my-8 border-t border-dashed border-gray-300" />

            {/* FILIAÇÃO */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-brand-600 flex gap-3">
                <FaPeopleRoof size={36} />
                <span className="self-center">Filiação</span>
              </h2>

              <div className="flex flex-col gap-4">
                <Input
                  className="rounded-2xl"
                  variant="white"
                  label="Nome da mãe"
                  value={formData.mae}
                  onChange={(e) =>
                    setFormData({ ...formData, mae: e.target.value })
                  }
                />

                <Input
                  className="rounded-2xl"
                  variant="white"
                  label="Nome do pai"
                  value={formData.pai}
                  onChange={(e) =>
                    setFormData({ ...formData, pai: e.target.value })
                  }
                />
              </div>
            </div>

            {/* DIVISOR */}
            <div className="my-8 border-t border-dashed border-gray-300" />

            {/* DOCUMENTO */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-brand-600 flex gap-3">
                <BiSolidFileDoc size={36} />
                <span className="self-center">Documento de identificação</span>
              </h2>

              <div className="flex flex-col gap-4">
                <Input
                  className="rounded-2xl"
                  variant="white"
                  label="CPF - XXX.XXX.XXX-XX"
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: e.target.value })
                  }
                />

                <Input
                  className="rounded-2xl"
                  variant="white"
                  label="RG - XX.XXX.XXX-X"
                  value={formData.rg}
                  onChange={(e) =>
                    setFormData({ ...formData, rg: e.target.value })
                  }
                />

                <Input
                  className="rounded-2xl"
                  variant="white"
                  label="Órgão emissor"
                  value={formData.orgao}
                  onChange={(e) =>
                    setFormData({ ...formData, orgao: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 1 && (
          <></>
        )}

        {/* STEP 3 */}
        {step === 2 && (
          <></>
        )}

        {/* STEP 4 */}
        {step === 3 && (
          <></>
        )}

        <div className="flex justify-between">
          {/* BOTÃO - Voltar*/}
          <div className="flex justify-end">
            <button type="button" onClick={handleNext}> 
              Voltar
            </button>
          </div>

          {/* BOTÃO - Próximo*/}
          <div className="flex justify-end">
            <button type="button" onClick={handleNext}>
              Avançar
            </button>
          </div>

        </div>
        
      </form>
    </Register>
  );
}

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const API = "http://localhost:3000";

function RedefinirSenha() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const [senha, setSenha] = useState("");
    const [confirmacao, setConfirmacao] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");

    async function enviar(e) {
        e.preventDefault();
        setMensagem("");
        setErro("");
        if (!token) return setErro("Link de recuperação inválido.");
        if (senha !== confirmacao) return setErro("As senhas não coincidem.");
        try {
            const resposta = await fetch(`${API}/auth/redefinir-senha`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, senha })
            });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.mensagem);
            setMensagem(dados.mensagem);
            setSenha("");
            setConfirmacao("");
        } catch (e) {
            setErro(e.message || "Não foi possível redefinir a senha.");
        }
    }

    return (
        <div className="tela-auth">
            <div className="card-auth">
                <h1>Nova senha</h1>
                <p className="text-muted">Escolha uma nova senha para sua conta.</p>
                <form onSubmit={enviar}>
                    <label>Nova senha</label>
                    <input className="form-control mb-3" type="password" minLength="6" value={senha} onChange={(e) => setSenha(e.target.value)} required />
                    <label>Confirmar nova senha</label>
                    <input className="form-control mb-3" type="password" minLength="6" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} required />
                    {erro && <div className="alert alert-danger">{erro}</div>}
                    {mensagem && <div className="alert alert-success">{mensagem}</div>}
                    <button className="btn btn-primary w-100 mb-3" disabled={!!mensagem}>Salvar nova senha</button>
                </form>
                <Link to="/" className="link-auth">Voltar para o login</Link>
            </div>
        </div>
    );
}
export default RedefinirSenha;

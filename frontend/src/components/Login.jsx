import { useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:3000";

function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [carregando, setCarregando] = useState(false);

    async function enviar(e) {
        e.preventDefault();
        setMensagem("");
        setCarregando(true);
        try {
            const resposta = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha })
            });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.mensagem);
            localStorage.setItem("token", dados.token);
            localStorage.setItem("usuario", JSON.stringify(dados.usuario));
            onLogin(dados.usuario);
        } catch (erro) {
            setMensagem(erro.message || "Erro ao fazer login.");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="tela-auth">
            <div className="card-auth">
                <h1>Sistema de Acesso</h1>
                <p className="text-muted">Entre com sua conta</p>
                <form onSubmit={enviar}>
                    <label>E-mail</label>
                    <input className="form-control mb-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <label>Senha</label>
                    <input className="form-control mb-2" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
                    <div className="text-end mb-3">
                        <Link to="/esqueci-senha" className="link-auth">Esqueci minha senha</Link>
                    </div>
                    {mensagem && <div className="alert alert-danger">{mensagem}</div>}
                    <button className="btn btn-primary w-100" disabled={carregando}>
                        {carregando ? "Entrando..." : "Entrar"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;

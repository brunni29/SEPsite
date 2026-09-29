import { useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:3000";

function EsqueciSenha() {
    const [email, setEmail] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");

    async function enviar(e) {
        e.preventDefault();
        setMensagem("");
        setErro("");
        try {
            const resposta = await fetch(`${API}/auth/esqueci-senha`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.mensagem);
            setMensagem(dados.mensagem);
        } catch (e) {
            setErro(e.message || "Não foi possível solicitar a recuperação.");
        }
    }

    return (
        <div className="tela-auth">
            <div className="card-auth">
                <h1>Recuperar senha</h1>
                <p className="text-muted">Informe o e-mail usado no cadastro.</p>
                <form onSubmit={enviar}>
                    <label>E-mail</label>
                    <input className="form-control mb-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    {erro && <div className="alert alert-danger">{erro}</div>}
                    {mensagem && <div className="alert alert-success">{mensagem}</div>}
                    <button className="btn btn-primary w-100 mb-3">Enviar link de recuperação</button>
                </form>
                <Link to="/" className="link-auth">Voltar para o login</Link>
            </div>
        </div>
    );
}
export default EsqueciSenha;

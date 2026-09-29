import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import Cadastro from "./components/Cadastro";
import Dashboard from "./components/Dashboard";
import Agenda from "./pages/Agenda";
import Membros from "./pages/Membros";
import Tarefas from "./pages/Tarefas";
import Projetos from "./pages/Projetos";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import Layout from "./components/Layout";

function App() {
    const [usuario, setUsuario] = useState(() => {
        const salvo = localStorage.getItem("usuario");
        return salvo ? JSON.parse(salvo) : null;
    });

    function entrar(dados) {
        setUsuario(dados);
    }

    function sair() {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");

        setUsuario(null);
    }

    const podeCadastrar = [
        "administrador",
        "diretor",
        "mobilizador"
    ].includes(usuario?.nivel_acesso);

    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/"
                    element={
                        usuario ? (
                            <Navigate to="/dashboard" />
                        ) : (
                            <Login onLogin={entrar} />
                        )
                    }
                />

                <Route path="/esqueci-senha" element={usuario ? <Navigate to="/dashboard" /> : <EsqueciSenha />} />

                <Route path="/redefinir-senha" element={usuario ? <Navigate to="/dashboard" /> : <RedefinirSenha />} />

                <Route
                    path="/dashboard"
                    element={
                        usuario ? (
                            <Layout usuario={usuario} onLogout={sair}>
                                <Dashboard usuario={usuario} onLogout={sair} />
                            </Layout>
                        ) : (
                            <Navigate to="/" />
                        )
                    }
                />

                <Route
                    path="/agendamentos"
                    element={
                        usuario ? (
                            <Layout usuario={usuario} onLogout={sair}>
                                <Agenda />
                            </Layout>
                        ) : (
                            <Navigate to="/" />
                        )
                    }
                />

                <Route
                    path="/membros"
                    element={
                        usuario ? (
                            <Layout usuario={usuario} onLogout={sair}>
                                <Membros />
                            </Layout>
                        ) : (
                            <Navigate to="/" />
                        )
                    }
                />

                <Route
                    path="/projetos"
                    element={
                        usuario && podeCadastrar ? (
                            <Layout usuario={usuario} onLogout={sair}>
                                <Projetos />
                            </Layout>
                        ) : (
                            <Navigate to={usuario ? "/dashboard" : "/"} />
                        )
                    }
                />

                <Route
                    path="/tarefas"
                    element={
                        usuario ? (
                            <Layout usuario={usuario} onLogout={sair}>
                                <Tarefas />
                            </Layout>
                        ) : (
                            <Navigate to="/" />
                        )
                    }
                />

                <Route
                    path="/cadastro"
                    element={
                        usuario && podeCadastrar ? (
                            <Layout usuario={usuario} onLogout={sair}>
                                <Cadastro />
                            </Layout>
                        ) : (
                            <Navigate to={usuario ? "/dashboard" : "/"} />
                        )
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;

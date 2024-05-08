import { useState } from "react";
import { login } from "../../context/ContextAuth";

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handlerEmailChange = (event) => setEmail(event.target.value)
    const handlerPasswordChange = (event) => setPassword(event.target.value)

    // const submitLogin = () => signInWithEmailAndPassword(auth,email,password)
    // const submitLogin = () => login(email,password);
    function submitLogin(event) { event.preventDefault(); login(email, password); }


    return (
        <section>
            <h2>Teste</h2>
            <form onSubmit={submitLogin}>
                <legend>Login</legend>
                <fieldset>
                    <ul>
                        <li>
                            <label htmlFor="email">Email</label>
                            <input type="email" onChange={handlerEmailChange} id="email" />
                        </li>
                        <li>
                            <label htmlFor="senha">Senha</label>
                            <input type="password" onChange={handlerPasswordChange} id="senha" />
                        </li>
                    </ul>
                    <button type="submit">Login</button>
                </fieldset>
            </form>
        </section>
    )
}
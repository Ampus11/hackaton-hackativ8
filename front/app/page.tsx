import { Workspace } from "../components/workspace";

/**
 * The whole app lives at `/` and is a client component.
 *
 * The session is an HttpOnly cookie that JavaScript cannot read, so "am I
 * signed in" cannot be answered during a server render — it has to be asked of
 * the API from the browser. Rendering the shell as a Server Component would
 * only produce markup that is immediately discarded once the client resolves the
 * session, so the page stays a thin wrapper and the client does the work.
 */
export default function Home() {
	return <Workspace />;
}

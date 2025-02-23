import { Benutzer } from "../../src/models/BenutzerModel";
import { loginBenutzer, registerBenutzer } from "../../src/services/AuthenticationService"

describe("AuthenticationService tests", () => {
    test("Register and login with valid credentials", async () => {
        const registered = await registerBenutzer(
            "dima@riffel.de", "Dima", "12445"
        )
        const found = await Benutzer.findOne({ email: "dima@riffel.de" }).exec();
        expect(found).toBeDefined();
        expect(registered).toEqual(found!.id);

        const loggedIn = await loginBenutzer("dima@riffel.de", "12445");
        expect(loggedIn).toEqual(found!.id);
    })

    test("Login with invalid credentials", async () => {
        const registered = await registerBenutzer(
            "dima@riffel.de", "Dima", "12445"
        )
        const found = await Benutzer.findOne({ email: "dima@riffel.de" }).exec();
        expect(found).toBeDefined();
        expect(registered).toEqual(found!.id);

        let loggedIn = await loginBenutzer("dima@riffel.de", "15125151");
        expect(loggedIn).toEqual(false);

        loggedIn = await loginBenutzer("dim@riffel.de", "12445");
        expect(loggedIn).toEqual(false);
    })

    test("Register with same email", async () => {
        let registered = await registerBenutzer(
            "dima@riffel.de", "Dima", "12445"
        )
        expect(registered).toBeTruthy();
        registered = await registerBenutzer(
            "dima@riffel.de", "Dima", "12445"
        )
        expect(registered).toEqual(false);
    })
})
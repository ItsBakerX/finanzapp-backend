import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from "fs";
import path from "path";
import { EmailTemplate } from "../../src/routes/KontaktRouter";

dotenv.config();

const transporter = nodemailer.createTransport({
	service: "Gmail",
	host: "smtp.gmail.com",
	port: 465,
	secure: true,
	auth: {
		user: "budgetbuddygab@gmail.com",
		pass: "wpej ixru iatp avai",
	},
});

export const sendConfirmationEmail = async (to: string, code: string) => {
    const templatePath = path.join(__dirname, "../templates/confirmation_email.html");
	let htmlContent = fs.readFileSync(templatePath, "utf8");
	const mailOptions = {
		from: process.env.EMAIL_ADRESS,
		to: to,
		subject:
			"Bestätige deine E-Mail Adresse, damit wir wissen, dass du kein Roboter bist, der die Welt erobern will",
		text: `Dein Bestätigungscode für BudgetBuddy lautet: ${code}`,
		html: htmlContent.replace("replace_code", code),
		attachments: [
			{
				filename: "logo_icon.png",
				path: path.join(__dirname, "../templates/logo_icon.png"),
				cid: "logo_icon",
			},
		],
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log("Confirmation (Register) Email sent");
	} catch (e) {
		console.log("Error sending email: ", e);
		throw new Error("Error sending email");
	}
};

export const sendKontaktEmail = async (template: EmailTemplate) => {
    const mailOptions = {
        from: process.env.EMAIL_ADRESS,
        to: process.env.EMAIL_ADRESS,
        subject: `Kontaktanfrage Anliegen: ${template.anliegen}`,
        text: `Betreff: ${template.betreff}\n\Von: ${template.email}\n\n${template.message}`,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log('Kontakt Email sent');
    } catch (e) {
        console.log('Error sending email: ', e);
        throw new Error('Error sending email');
    }
}
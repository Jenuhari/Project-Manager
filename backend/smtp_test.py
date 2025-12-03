# smtp_test.py
import os, smtplib
from email.message import EmailMessage

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
FROM = os.getenv("FROM_EMAIL", SMTP_USER)
TO = os.getenv("TEST_TO", SMTP_USER) 

msg = EmailMessage()
msg["From"] = FROM
msg["To"] = TO
msg["Subject"] = "SMTP test"
msg.set_content("Testing SMTP from server.")

try:
    if SMTP_PORT == 465:
        smtp = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)
    else:
        smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()

    print("Logging in as", SMTP_USER)
    smtp.login(SMTP_USER, SMTP_PASS)
    smtp.send_message(msg)
    smtp.quit()
    print("Email sent OK")
except Exception as e:
    print("Error sending email:", repr(e))

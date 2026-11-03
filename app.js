// Avialae Labs sign-up form. Sends one JSON object to the sign-up server on the
// operator's Mac (backend/waitlist_server.py), published through a Cloudflare Tunnel.
"use strict";

(function () {
  var LOCAL = location.hostname === "127.0.0.1" || location.hostname === "localhost";
  var API = (LOCAL ? "http://127.0.0.1:8092" : "https://api.avialaelabs.com") + "/v1/waitlist";
  var opened = Date.now();

  document.getElementById("year").textContent = String(new Date().getFullYear());

  var form = document.getElementById("signup");
  if (!form) return;
  var status = document.getElementById("form-status");
  var submit = document.getElementById("submit");
  var FIELDS = ["name", "age", "location", "email", "phone", "wants", "consent"];

  function value(id) { return (document.getElementById(id).value || "").trim(); }

  var RULES = {
    name: function (v) { return v ? "" : "Enter your name."; },
    age: function (v) {
      if (!/^\d+$/.test(v)) return "Enter your age in years.";
      var n = parseInt(v, 10);
      if (n < 13) return "Early access is for ages 13 and up. A parent can sign up for your home.";
      return n > 120 ? "Enter your age in years." : "";
    },
    location: function (v) { return v ? "" : "Enter a city and state or country."; },
    email: function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v) ? "" : "Enter an email address like name@example.com."; },
    phone: function (v) { return !v || /^\+?[0-9 ().-]{7,32}$/.test(v) ? "" : "Enter a phone number using digits, spaces, dashes or +."; },
    wants: function (v) { return v ? "" : "Add a sentence or two about what you'd want."; },
    consent: function () { return document.getElementById("consent").checked ? "" : "Agree to be contacted so you can get an invitation."; },
  };

  function show(field, message) {
    var input = document.getElementById(field);
    var slot = document.getElementById(field + "-err");
    if (slot) slot.textContent = message || "";
    if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function check(field) {
    var message = RULES[field](field === "consent" ? "" : value(field));
    show(field, message);
    return message;
  }

  // Check each field as people leave it, once they've typed something.
  FIELDS.forEach(function (field) {
    var input = document.getElementById(field);
    input.addEventListener("blur", function () {
      if (field === "consent" || input.value) check(field);
    });
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") check(field);
    });
  });

  function done(name) {
    var area = document.getElementById("form-area");
    var box = document.createElement("div");
    box.className = "done";
    box.id = "done";
    box.tabIndex = -1;
    box.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".3"/><path d="M14 25l7 7 13-15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var title = document.createElement("h3");
    title.textContent = "Request received, " + name.split(" ")[0] + ".";
    var text = document.createElement("p");
    text.textContent = "Thanks for telling us what you need. Homes are invited in small groups, and an email will arrive when there's a spot for yours.";
    box.appendChild(title);
    box.appendChild(text);
    area.replaceChildren(box);
    box.focus();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    status.textContent = "";
    var first = null;
    FIELDS.forEach(function (field) {
      if (check(field) && !first) first = field;
    });
    if (first) { document.getElementById(first).focus(); return; }

    var interests = Array.prototype.map.call(form.querySelectorAll('input[name="interests"]:checked'),
      function (box) { return box.value; });
    var body = {
      name: value("name"), age: parseInt(value("age"), 10), location: value("location"),
      email: value("email"), phone: value("phone"), wants: value("wants"), interests: interests,
      consent: true, company: value("company"), elapsed: Date.now() - opened,
    };
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    submit.textContent = "Sending…";

    fetch(API, {
      method: "POST", mode: "cors", credentials: "omit", referrerPolicy: "no-referrer",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }).then(function (reply) {
      return reply.json().catch(function () { return {}; }).then(function (data) {
        if (reply.ok) return done(body.name);
        if (data.field && RULES[data.field]) {
          show(data.field, data.error);
          document.getElementById(data.field).focus();
        } else {
          status.textContent = data.error || "Unable to send right now. Try again in a minute.";
        }
      });
    }).catch(function () {
      status.textContent = "Sign-ups are unavailable right now. Try again in a little while.";
    }).then(function () {
      if (!document.getElementById("done")) {
        submit.disabled = false;
        submit.removeAttribute("aria-busy");
        submit.textContent = "Request Access";
      }
    });
  });
})();

/* =========================
   REALTIME MODULE
   Helpers untuk info waktu & konteks realtime
========================= */

function getNowWIB() {
    return new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })
}

function getDateOnly() {
    return new Date().toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    })
}

function getTimeOnly() {
    return new Date().toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit"
    })
}

function getYear() {
    return new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric"
    })
}

module.exports = { getNowWIB, getDateOnly, getTimeOnly, getYear }

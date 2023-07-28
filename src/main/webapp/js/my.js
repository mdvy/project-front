//lists for using in select-inputs, load from repository
let professions;
let races;

function getListOfUsers(pageN) { //load list of users from repository and fill the table

    $("#tablePlayers").find("tr:has(td)").remove();

    $.get("/rest/players?pageSize=" + $("#table_size_selector").val() + "&pageNumber=" + pageN, function (data) {
        $.each(data, function (i, item) {
            $("<tr id='row" + item.id + "'><td>" +
                item.id + "</td><td>" +
                item.name + "</td><td>" +
                item.title + "</td><td>" +
                item.race + "</td><td>" +
                item.profession + "</td><td>" +
                item.level + "</td><td>" +
                new Date(item.birthday).toLocaleDateString() + "</td><td>" +
                item.banned + "</td><td>" +
                "<img src='/img/edit.png' class='pointer_mouse' onclick='editUser(" + item.id + ")'>" + "</td><td>" +
                "<img src='/img/delete.png' class='pointer_mouse' onclick='deleteUser(" + item.id + ")'>" + "</td></tr>"
            ).appendTo("#tablePlayers");
        })
    });

    let totalCount = getTotalCount();
    let countPerPage = $("#table_size_selector").val();
    if (countPerPage == null) countPerPage = 3;

    let pagesCount = Math.ceil(totalCount / countPerPage);

    $("li.page-item").remove();

    //create list of pages at down of table

    for (let i = 1; i <= pagesCount; i++) {
        let a_tag = "<a href='#'>" + i + "</a>";
        let a = $(a_tag)
            .attr("id", "page_button_" + i)
            .attr("class", "page-link");

        // highlight current page
        if (i === pageN + 1) {
            a.attr("style", "color: darkorange; font-weight: bold;");
            a.attr("class", "page-link curr-page");
        } else
            a.attr("onclick", "getListOfUsers(" + (i - 1) + ")");

        $("<li class='page-item'></li>").append(a).appendTo("#page_counter");

    }
}

function getTotalCount() { //return count of users in repository
    let res = 0;
    $.ajax({
        url: "/rest/players/count",
        async: false,
        success: function (result) {
            res = parseInt(result)
        }
    })
    return res;
}

function deleteUser(user_id) {
    $.ajax({
        url: "/rest/players/" + user_id,
        type: "DELETE",
        success: function () {
            let last_page = parseInt($("#page_counter").find("li:last").find("a:first").text());
            if (getTotalCount() % $("#table_size_selector").val() === 0 && getCurrentPage() + 1 === last_page)
                getListOfUsers(getCurrentPage() - 1);
            else
                getListOfUsers(getCurrentPage());
        }
    });
}

function getCurrentPage() {
    return parseInt($(".curr-page:first").attr("id").slice(12)) - 1;
}

function editUser(user_id) { //make user editable

    //repaint images
    $("#row" + user_id).find("td:eq(9)").find("img").remove();
    $("#row" + user_id).find("td:eq(8)").find("img").attr("src", "/img/save.png");
    $("#row" + user_id).find("td:eq(8)").find("img").attr("onclick", "saveUser(" + user_id + ")");

    //create name input field and fill with current text

    let name = $("#row" + user_id).find("td:eq(1)");
    name.html("<input id='edit_name_" + user_id + "' type='text' class='form-control' value ='" + name.text() + "' >");

    //create title input and fill with current text

    let title = $("#row" + user_id).find("td:eq(2)");
    title.html("<input id='edit_title_" + user_id + "' type='text' class='form-control' value ='" + title.text() + "' >");


    //fill professions for option-field from repository

    let profession = $("#row" + user_id).find("td:eq(4)");
    let profession_value = profession.text();
    profession.html("<select id='edit_profession_" + user_id + "' class='form-select' > </select>");

    $.each(professions, function (i, item) {
        $("#edit_profession_" + user_id).append("<option>" + item + "</option>");
    });

    $("#edit_profession_" + user_id).val(profession_value);


    //fill races for option-field from repository

    let race = $("#row" + user_id).find("td:eq(3)");
    let race_value = race.text();
    race.html("<select id='edit_race_" + user_id + "' class='form-select' > </select>");

    $.each(races, function (i, item) {
        $("#edit_race_" + user_id).append("<option>" + item + "</option>");
    });

    $("#edit_race_" + user_id).val(race_value);

    //fill levels for option-field from repository

    let level = $("#row" + user_id).find("td:eq(5)");
    let level_value = level.text();
    level.html("<select id='edit_level_" + user_id + "' class='form-select' > </select>");

    for (let i = 1; i <= 100; i++)
        $("<option>" + i + "</option>").appendTo("#edit_level_" + user_id);
    $("#edit_level_" + user_id).val(level_value);


    //create birthday input and fill with existing text

    let birthday = $("#row" + user_id).find("td:eq(6)");
    let birthday_value = birthday.text();

    birthday.html(
        "<input data-date-format='dd.mm.yyyy' style='width: 150px' type='text' " +
        "class='datepicker form-control' id='datepicker_" + user_id + "'>"
    );

    loadDatepicker();

    $("#datepicker_" + user_id).val(birthday_value);


    //create banned input and fill with existing value

    let banned = $("#row" + user_id).find("td:eq(7)");
    let banned_value = banned.text();

    banned.html(
        "<select class='form-select' id='edit_banned_" + user_id + "'>" +
        "<option>false</option>" +
        "<option>true</option></select>");

    $("#edit_banned_" + user_id).val(banned_value);
}

function saveUser(user_id) { //save edited user

    let name = $("#edit_name_" + user_id).val();
    if (name.length === 0) {
        $("#edit_name_" + user_id).focus();
        return;
    }

    let title = $("#edit_title_" + user_id).val();
    if (title.length === 0) {
        $("#edit_title_" + user_id).focus();
        return;
    }

    let date_parsed = dateFromString($("#datepicker_" + user_id).val());
    if (date_parsed === -1) {
        $("#datepicker_" + user_id).focus();
        return;
    }

    let race = $("#edit_race_" + user_id).val();
    let profession = $("#edit_profession_" + user_id).val();
    let level = $("#edit_level_" + user_id).val();
    let birthday = date_parsed.getTime();
    let banned = $("#edit_banned_" + user_id).val();

    $.ajax({
        dataType: "json",
        url: "/rest/players/" + user_id,
        type: "POST",
        async: false,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
            "name": name,
            "title": title,
            "race": race,
            "profession": profession,
            "level": level,
            "birthday": birthday,
            "banned": banned
        }),
        success: function () {
            getListOfUsers(getCurrentPage());
        }
    });
}

function dateFromString(string) { //method for parsing Date from localeDate
    const regex = /^(0?[1-9]|[12][0-9]|3[01])\.(0?[1-9]|1[012])\.((19|20)\d\d)$/;

    if (!regex.test(string))
        return -1;

    let date = string.split(".");
    let day = date[0];
    let month = date[1] - 1;
    let year = date[2];

    return new Date(year, month, day);
}

function initFormFields() { //init list-fields in form on load page

    loadDatepicker();

    professions = getListFromRepo("/rest/players/listOfProfession");
    races = getListFromRepo("/rest/players/listOfRace");

    $.each(professions, function (i, item) {
        $("#create_profession").append("<option>" + item + "</option>");
    });

    $.each(races, function (i, item) {
        $("#create_race").append("<option>" + item + "</option>");
    });

    for (let i = 1; i <= 100; i++)
        $("#create_level").append("<option>" + i + "</option>");

    $("#create_datepicker").val(new Date().toLocaleDateString());
}

function getListFromRepo(path) { //return list of data by Get-method from repository
    let result;
    $.ajax({
        url: path,
        type: "GET",
        async: false,
        success: function (data) {
            result = data;
        }
    });
    return result;
}

function createUser() { //create user via the form

    let name = $("#create_name").val();
    if (name.length === 0) {
        $("#create_name").focus();
        return;
    }

    let title = $("#create_title").val();
    if (title.length === 0) {
        $("#create_title").focus();
        return;
    }

    let date_parsed = dateFromString($("#create_datepicker").val());
    if (date_parsed === -1) {
        $("#create_datepicker").focus();
        return;
    }

    let birthday = date_parsed.getTime();
    let race = $("#create_race").val();
    let profession = $("#create_profession").val();
    let level = $("#create_level").val();
    let banned = $("#create_banned").val();

    $.ajax({
        dataType: "json",
        url: "/rest/players/",
        type: "POST",
        async: false,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
            "name": name,
            "title": title,
            "race": race,
            "profession": profession,
            "level": level,
            "birthday": birthday,
            "banned": banned
        }),
        success: function () {
            let last_page = parseInt($("#page_counter").find("li:last").find("a:first").text());
            if (isNaN(last_page)) last_page = 0;
            if (getTotalCount() % $("#table_size_selector").val() === 1) {
                getListOfUsers(last_page);
            } else
                getListOfUsers(last_page - 1);
        }
    });
}

function loadDatepicker() {
    $('.datepicker').datepicker()
}
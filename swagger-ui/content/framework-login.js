/* global swaggerUi */
/* global SwaggerClient */
$(function() {
	//$("#logo, #api_selector div").remove();
	var option1 = "UserName";
	var option2 = "Glx2ID";
	
	$("#input_Glx2").css("display", "none");
	$(".glxid").hide();
	$("#change :input, #change :button").prop("disabled", true);

	// log to message-bar
	function logIssue(message) {
		$("#message-bar").text(message);
	}

	//waiting time for ajax request
	var timeoutMs = 20000;

	var userdatas = new Array();

	var setElementsDisabledProp = function (disabled) {
		$(".login_Method").prop("disabled", disabled);
		$("#input_UserName, #input_Password, #input_Domain, #input_Glx2, #login_Method").prop("disabled", disabled);
		$("#submitLogin, #submitLogout").prop("disabled", disabled);
	}

	// Clean header auth
	var deleteAuth = function () {
		userdatas = [];
		for (var key in swaggerUi.api.clientAuthorizations.authz) {
			if (swaggerUi.api.clientAuthorizations.authz.hasOwnProperty(key)) {
				swaggerUi.api.clientAuthorizations.remove(key);
			}
		}
		document.execCommand("ClearAuthenticationCache");
		$("#input_UserName, #input_Password, #input_Domain, #input_Glx2")
			.val("")
			.prop("disabled", false);
		$("#login_Method").prop("disabled", false);
		$("#logged_Glx2").text("");
		$("#input_NewPassword,#input_NewPassword2").val("");
		$("#input_NewPassword,#input_NewPassword2,#submitPassword, #cancelPassword").prop("disabled", false);
		$("#change :input, #change :button").prop("disabled", true);
	}

	// Normal Login
	var loginWithUserName = function (username, domain, pword) {
		var res = false;
		$.ajax({
			type: "POST",
			url: "/api/platform/v1/session",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			async: false,
			beforeSend: function (xhr) {
				logIssue("Please wait.");
				// generate base 64 string from username + password
				var s = domain + "\\" + username + ":" + pword;
				// set header
				xhr.setRequestHeader("Authorization", "Basic " + btoa(s));
			},
			success: function(loginData) {
				$("#change :input, #change :button").prop("disabled", false);
				if (loginData) {
					$("#logged_Glx2").text(loginData.ResourceId);
					// 64 bit encodes glx2
					swaggerUi.api.clientAuthorizations.add("key", new SwaggerClient.ApiKeyAuthorization("Authorization", "Basic " + btoa(loginData.ResourceId + ':'), "header"));
					logIssue("Successfully logged in. Created session '" + loginData.ResourceId + "'.");
					userdatas[0] = username;
					userdatas[1] = domain;
					userdatas[2] = pword;
					res = true;
				} else {
					logIssue("Error logging. Verify input fields.");
				}
			},
			error: function (jqXhr, textStatus) {
				deleteAuth();
				logIssue("Error logging in for Username '" + username + "' and Domain '" + domain + "'," + textStatus);
			},
			timeout: timeoutMs
		});
		return res;
	};

	// ChangePw
	var changePwd = function (datas) {
		if (datas.length === 0) {
			logIssue("missing srp datas");
			return;
		}
		var user = datas[0];
		var domain = datas[1];
		var oldPassword = datas[2];
		var newPassword = $("#input_NewPassword2").val();
		var newPasswordClearText = newPassword;
		var srpTransactId = "";
		var srpMc = "";
		var srpK = "";
		var srpEpha = "";
		if ((datas.length > 4) && (datas[4].length > 0)) {
			srpTransactId = datas[3];
			srpMc = datas[4];
			srpK = datas[5];
			srpEpha = datas[6];
			var srpIdentity = datas[7];
			var srp = new SRPClient(srpIdentity, oldPassword, 1024, "sha-256");
			oldPassword = srp.encryptPlainText_Aes(oldPassword, srpK, srpEpha);
			newPassword = srp.encryptPlainText_Aes(newPassword, srpK, srpEpha);
		}
		if (!user || !domain) {
			logIssue("missing user or domain");
			return;
		}
		$.ajax({
			type: "POST",
			url: "/api/platform/v1/ChangePasswordOperation",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			data: {
				UserName: user,
				FirmToken: domain,
				OldPassword: oldPassword,
				NewPassword: newPassword,
				SRPTransactID: srpTransactId,
				SRP_M_c: srpMc
			},
			beforeSend: function() {
				logIssue("Please wait.");
			},
			success: function(data) {
					$("#input_NewPassword,#input_NewPassword2").val("");
					$("#input_NewPassword,#input_NewPassword2,#submitPassword,#cancelPassword").prop("disabled", false);
					userdatas = [];
					alert("Change password succeed!");
					startlogin(user, domain, newPasswordClearText);
			},
			error: function (jqXhr, textStatus) {
				logIssue("Failed to change password, " + textStatus);
				deleteAuth();
			},
			timeout: timeoutMs
		});

	}

	// SRP login (Session)
	var srpSessionRequest = function (domain, user, password, responseData) {
		if (!domain || !user || !password || !responseData) {
			return false;
		}
		var ust = responseData.userSRPTransaction;
		var srpidentity = user + "@" + ust["FirmName"];
		var srp = new SRPClient(srpidentity, password, 1024, "sha-256");
		var transactId = responseData.ResourceId;
		var mc = srp.calculateMc(responseData.Srp_s, responseData.Srp_b);
		var s = domain + "\\" + user + ":" ;
		var res = false;
		$.ajax({
			type: "POST",
			url: "/api/platform/v1/Session",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			async: false,
			beforeSend: function (xhr) {
				logIssue("Please wait.");
				$('body').css({ cursor: 'wait' });
				// set header
				xhr.setRequestHeader("SRPTransactionID", transactId);
				xhr.setRequestHeader("SRPIdentity", srpidentity);
				xhr.setRequestHeader("SRPEphA", srp.SRP_A.toString());
				xhr.setRequestHeader("SRPMc", mc);
				xhr.setRequestHeader("Authorization", "Basic " + btoa(s));
			},
			success: function (data) {
				$("#change :input, #change :button").prop("disabled", false);
				$('body').css({ cursor: '' });
				userdatas[0] = user;
				userdatas[1] = domain;
				userdatas[2] = password;
				userdatas[3] = transactId;
				userdatas[4] = mc;
				userdatas[5] = srp.clientKey.toString();
				userdatas[6] = srp.SRP_A.toString();
				userdatas[7] = srpidentity;
				if (data.MustChangePassword) {
					logIssue("Must change password");
					$("#submitLogout").prop("disabled", false);
				} else {
					swaggerUi.api.clientAuthorizations.add("key", new SwaggerClient.ApiKeyAuthorization("Authorization", "Basic " + btoa(data.ResourceId + ':'), "header"));
					logIssue("Successfully logged in. Created session '" + data.ResourceId + "'.");
					$("#logged_Glx2").text(data.ResourceId);
					$("#submitLogin, #submitLogout").prop("disabled", false);
				}
				res = true;
			},
			error: function (jqXhr, textStatus) {
				$('body').css({ cursor: '' });
				res = false;
			},
			timeout: timeoutMs
		});
		return res;
	}

	// SRP login (SRPTransaction)
	var srpTransactionRequest = function (user, domain, pword) {
		if (!user || !domain || !pword) {
			logIssue("Missing required value.");
			return false;
		}
		domain = domain.toUpperCase();
		user = user.toUpperCase();
		var s = domain + "\\" + user + ":";
		var res = false;
		$.ajax({
			type: "POST",
			url: "/api/platform/v1/SRPTransaction",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			async: false,
			beforeSend: function (xhr) {
				logIssue("Please wait.");
				$('body').css({ cursor: 'wait' });
				// generate base 64 string from user 
				// set header
				xhr.setRequestHeader("Authorization", "Basic " + btoa(s));
			},
			success: function (data) {
				$('body').css({ cursor: '' });
				if (!data.ResourceId) {
					res = false;
					return;
				}
				res = srpSessionRequest(domain, user, pword, data);
			},
			error: function(e) {
				res = false;
				$('body').css({ cursor: '' });
			},
			timeout: timeoutMs
		});
		return res;
	};

	// Complete Login
	var startlogin = function(user, domain, pword) {
		try {
			setElementsDisabledProp(true);
			for (var key in swaggerUi.api.clientAuthorizations.authz) {
				if (swaggerUi.api.clientAuthorizations.authz.hasOwnProperty(key)) {
					swaggerUi.api.clientAuthorizations.remove(key);
				}
			}
			var srplogin = srpTransactionRequest(user, domain, pword);
			if (!srplogin) {
				var nonsrpLogin = loginWithUserName(user, domain, pword);
				if (nonsrpLogin) {
					$('body').css({ cursor: '' });
					$("#submitLogin, #submitLogout").prop("disabled", false);
					return;
				}
			} else {
				$('body').css({ cursor: '' });
				return;
			}
		} catch (ex) {
			console.error("Exception: " + ex);
		}
		$('body').css({ cursor: '' });
		setElementsDisabledProp(false);
	};

	// Glx2 login
	var loginWithGlx2 = function(username, domain, pword, glx2) {
		if (!glx2) {
			logIssue("Missing required value.");
			return false;
		}
		$.ajax({
			type: "GET",
			url: "/api/platform/v1/Session",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			beforeSend: function (xhr) {
				logIssue("Please wait.");
				// set header
				xhr.setRequestHeader("Authorization", "Basic " + btoa(glx2 + ':'));
			},
			success: function() {
				$("#logged_Glx2").text(glx2);
				$("#input_UserName, #input_Password, #input_Domain, #input_Glx2, #login_Method").prop("disabled", true);
				// 64 bit encodes glx2
				swaggerUi.api.clientAuthorizations.add("key", new SwaggerClient.ApiKeyAuthorization("Authorization", "Basic " + btoa(glx2 + ':'), "header"));
				logIssue("Successfully logged in with session '" + glx2 + "'.");
			},
			error: function (jqXhr, textStatus) {
				$("#input_UserName, #input_Password, #input_Domain, #input_Glx2").val("");
				logIssue("Error login. Invalid GLX ID " + glx2 + ". "+textStatus);
			},
			timeout: timeoutMs
		});
		return false;
	};

	// logout
	var logout = function (glx2, handler) {
		$.ajax({
			type: "DELETE",
			url: "/api/platform/v1/Session",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			beforeSend: function (xhr) {
				logIssue("Please wait.");
				// generate base 64 string from glx2
				// set header
				xhr.setRequestHeader("Authorization", "Basic " + btoa(glx2 + ':'));
			},
			success: function() {
				handler();
				logIssue("Successfully logged out session '" + glx2 + "'.");
			},
			error: function (jqXhr, textStatus) {
				handler("");
				logIssue("Failed  to log out. Invalid glx2" + glx2 + ". " +textStatus);
			},
			timeout: timeoutMs
		});
		return false;
	};


	// EVENT HANDLER

	var loginMethod = startlogin; //default login method

	$("#login_Method").change(function() {
		$("#input_UserName, #input_Password, #input_Domain, #input_Glx2").val("");
		logIssue("");
		$("#login_Method option:selected").each(function() {
			if ($(this).text() === option1) {
				$("#input_Glx2").css("display", "none");
				$("#input_Domain, #input_UserName, #input_Password").css("display", "inline-block");
				$("#change").fadeIn();
				loginMethod = startlogin;
			} else if ($(this).text() === option2) {
				$("#input_Domain, #input_UserName, #input_Password").css("display", "none");
				$("#input_Glx2").css("display", "inline-block");
				$("#change").fadeOut();
				loginMethod = loginWithGlx2;
			}
		});
	});

	$("#submitLogin").click(function() {
		var username = $("#input_UserName").val();
		var domain = $("#input_Domain").val();
		var password = $("#input_Password").val();
		var loggedGlx2 = $("#logged_Glx2").text();
		var inputGlx2 = $("#input_Glx2").val();
		// field validation
		if (loggedGlx2 !== "") {
			logIssue("Already logged in. With session '" + loggedGlx2 + "'.");
			return;
		}

		loginMethod(username, domain, password, inputGlx2);
	});

	$("#submitLogout").click(function() {
		var loggedGlx2 = $("#logged_Glx2").text();
		if (loggedGlx2 !== "") {
			logout(loggedGlx2, function() {
				// clear out operation fields

				deleteAuth();
			});
		} else {
			logIssue("Error logging out. No valid session.");
		}
	});

	$("#submitPassword").click(function() {
		if ($("#input_NewPassword").val() !== $("#input_NewPassword2").val() ||
			$("#input_NewPassword").val() === "" ) {
			logIssue("Invalid new password");
			return;
		}
		$("#input_NewPassword,#input_NewPassword2,#submitPassword, #cancelPassword").prop("disabled", true);
		$('body').css({ cursor: 'wait' });
		changePwd(userdatas);
		$('body').css({ cursor: '' });
		return;
	});

	$("#cancelPassword").click(function() {
		$("#input_NewPassword,#input_NewPassword2").val("");
	});
});

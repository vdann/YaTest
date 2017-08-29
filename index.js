'use strict';

// Ровно три слова
function validate_fio (fio) {
	fio = fio.split(/\s+/g);
	return fio.length == 3;
}

// Формат email-адреса, но только в доменах ya.ru, yandex.ru, yandex.ua, yandex.by, yandex.kz, yandex.com
function validate_email (email) {

	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (!re.test(email))
		return false;

	var filter = [
		"ya.ru",
		"yandex.ru",
		"yandex.ua",
		"yandex.by",
		"yandex.kz",
		"yandex.com"
	];

	return filter.indexOf(email.split('@')[1]) != -1;
}

/*
	Номер телефона, который начинается на +7, и имеет формат +7(999)999-99-99. 
	Кроме того, сумма всех цифр телефона не должна превышать 30. 
	Например, для +7(111)222-33-11 сумма равняется 24, а для +7(222)444-55-66 сумма равняется 47.
*/

function validate_phone (ph) {
	var re = /^\+7\(\d\d\d\)\d\d\d\-\d\d\-\d\d$/;
	if (!re.test(ph))
		return false;

	var sum = 0;
	var red = /^\d$/;
	for (var i = 0, n = ph.length; i < n; ++i) {
		if (red.test(ph[i]))
			sum += +ph[i];
	}

	console.log('validate_phone ' + sum);
	return sum <= 30;
}

function getRandomInt(min, max) {
	if (!max) {
		max = min
		min = 0;
	}

	return Math.floor(Math.random() * (max - min + 1)) + min;
}


var MyForm = {

	$myForm: null,
	$submit: null,
	$resultContainer: null,
	inputs: {
		fio: { el: null, validate: validate_fio },
		email: { el: null, validate: validate_email },
		phone: { el: null, validate: validate_phone },
	},

	init: function ($myForm, $resultContainer) {
		MyForm.$myForm = $myForm;
		MyForm.$resultContainer = $resultContainer;

		var $inputs = MyForm.$myForm.find('input');
		for (var i = 0, n = $inputs.length; i < n; ++i) {
			var inp = $inputs[i];
			if (!MyForm.inputs[inp.name])
				continue;

			MyForm.inputs[inp.name].el = inp;
			$(inp).on('change paste keyup', function () {
				MyForm.$submit.prop('disabled', false);

				MyForm.$resultContainer.removeClass('progress1 error success');
				MyForm.$resultContainer.text('');
			});
		}

		MyForm.$submit = MyForm.$myForm.find('#submitButton');
		MyForm.$myForm.submit(MyForm.submit);
	},

	/*
		Метод validate возвращает объект с признаком результата валидации (isValid) 
		и массивом названий полей, которые не прошли валидацию (errorFields).
	*/
	validate: function () {
		var errorFields = [];

		for (var k in MyForm.inputs) {
			var inp = MyForm.inputs[k];
			if (!inp.validate)
				continue;

			if (!inp.validate(inp.el.value.trim()))
				errorFields.push(k);
		}

		return {
			isValid: !errorFields.length,
			errorFields: errorFields
		};
	},

	/*
		Метод getData возвращает объект с данными формы, где имена свойств совпадают с именами инпутов.
	*/
	getData: function () {
		var inputs = MyForm.$myForm.find('input');
		var o = {};
		for (var i = 0, n = inputs.length; i < n; ++i) {
			var inp = inputs[i];
			if (inp.name)
				o[inp.name] = inp.value.trim();
		}

		return o;
	},

	/*
		Метод setData принимает объект с данными формы и устанавливает их инпутам формы. 
		Поля кроме phone, fio, email игнорируются.
	*/
	setData: function (obj) {

		for (var k in MyForm.inputs) {
			var v = obj[k];
			if (v) {
				var el = MyForm.inputs[k].el;
				el.setAttribute('value', v);
			}
		}
	},

	/*
		Метод submit выполняет валидацию полей и отправку ajax-запроса, если валидация пройдена. 
		Вызывается по клику на кнопку отправить.
	*/
	submit: function () {
		var valid = MyForm.validate();

		for (var k in MyForm.inputs) {
			var inp = MyForm.inputs[k].el;

			if (valid.errorFields.indexOf(inp.name) != -1)
				$(inp).addClass('error');
			else
				$(inp).removeClass('error');
		}

		MyForm.$submit.prop('disabled', valid.isValid);

		if (valid.isValid) {
			var data = MyForm.getData();
			MyForm.send(data);
		}


		return false;
	},

	// Метод send посылает данные на сервер
	send: function (data, progress) {
		
		if (!progress)
			progress = 0;

		var url = 'progress.json';
		var r = getRandomInt(100);
		if (r > 85)
			url = 'error.json';
		else if (r > 60)
			url = 'success.json';

		$.ajax({
			url: url,
			dataType: 'json',
			data: data,
			cache: false,
			success: function (d) {
				if (d.status == 'success') {
					MyForm.$resultContainer.removeClass('progress1');
					MyForm.$resultContainer.addClass('success');
					MyForm.$resultContainer.text('Success')
				}
				else if (d.status == 'error') {
					MyForm.$resultContainer.removeClass('progress1');
					MyForm.$resultContainer.addClass('error');
					MyForm.$resultContainer.text(d.reason || ' ');
				}
				else if (d.status == 'progress') {
					MyForm.$resultContainer.addClass('progress1');
					MyForm.$resultContainer.text('Progress ' + (d.timeout + progress) / 1000);
					console.log('status: progress ' + (d.timeout + progress));

					setTimeout(function () {
						MyForm.send(data, d.timeout + progress);
					}, d.timeout);

				}
				else {
					MyForm.$resultContainer.removeClass('progress1');
					MyForm.$resultContainer.addClass('error');
					MyForm.$resultContainer.text('Unknown status: ' + d.status);
					console.log('Unknown status: ' + d.status);
				}
			},
			error: function (err) {
				MyForm.$resultContainer.removeClass('progress1');
				MyForm.$resultContainer.addClass('error');
				MyForm.$resultContainer.text('ajax.err');
				console.log('ajax.err');
			}
		});
	}

};

MyForm.init($('#myForm'), $('#resultContainer'));

// test
MyForm.setData({
	fio: 'Иван Иванов И',
	email: 'ivan@ya.ru',
	phone: '+7(111)222-33-11',
	fake: 'la-la-la'
});

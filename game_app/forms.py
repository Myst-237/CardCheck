from django import forms

CHOICES = [('1', 'YES')]


class Choice(forms.Form):
    choice = forms.ChoiceField(choices=CHOICES, widget=forms.RadioSelect)


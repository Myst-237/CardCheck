# Generated by Django 3.1.4 on 2021-01-27 16:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game_app', '0007_auto_20210124_1859'),
    ]

    operations = [
        migrations.AddField(
            model_name='requests',
            name='is_rejected',
            field=models.BooleanField(default=False),
        ),
    ]

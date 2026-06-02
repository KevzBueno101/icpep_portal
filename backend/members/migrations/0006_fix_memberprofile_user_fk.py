from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_term_delegation'),
        ('members', '0005_memberprofile_coe_id_image'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE members_memberprofile
                DROP CONSTRAINT IF EXISTS members_memberprofile_user_id_d382804b_fk_auth_user_id;

                ALTER TABLE members_memberprofile
                DROP CONSTRAINT IF EXISTS members_memberprofile_user_id_fk_users_user_id;

                ALTER TABLE members_memberprofile
                ADD CONSTRAINT members_memberprofile_user_id_fk_users_user_id
                FOREIGN KEY (user_id)
                REFERENCES users_user(id)
                DEFERRABLE INITIALLY DEFERRED
                NOT VALID;
            """,
            reverse_sql="""
                ALTER TABLE members_memberprofile
                DROP CONSTRAINT IF EXISTS members_memberprofile_user_id_fk_users_user_id;

                ALTER TABLE members_memberprofile
                ADD CONSTRAINT members_memberprofile_user_id_d382804b_fk_auth_user_id
                FOREIGN KEY (user_id)
                REFERENCES auth_user(id)
                DEFERRABLE INITIALLY DEFERRED
                NOT VALID;
            """,
        ),
    ]
